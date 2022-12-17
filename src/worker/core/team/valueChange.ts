import { bySport, PHASE } from "../../../common";
import { draft, player, team, trade } from "..";
import { idb } from "../../db";
import { g, helpers, local } from "../../util";
import type {
	TradePickValues,
	PlayerContract,
	PlayerInjury,
	DraftPick,
} from "../../../common/types";
import { groupBy } from "../../../common/groupBy";
import { getNumPicksPerRound } from "../trade/getPickValues";
import { getTeamOvr } from "../trade/summary";

type Asset =
	| {
			type: "player";
			value: number;
			contractValue: number;
			injury: PlayerInjury;
			age: number;
	  }
	| {
			type: "pick";
			value: number;
			contractValue: number;
			injury: PlayerInjury;
			age: number;
			draftPick: number;
			draftYear: number;
	  };

let prevValueChangeKey: number | undefined;
let cache: {
	estValues: TradePickValues;
	gp: number;
	sortedWps: number[];
	sortedTeamOvrs: number[];
};

const zscore = (value: number) =>
	(value - local.playerOvrMean) / local.playerOvrStd;

const MIN_VALUE = bySport({
	baseball: -0.75,
	basketball: -0.5,
	football: -1,
	hockey: -0.5,
});
const MAX_VALUE = bySport({
	baseball: 2.5,
	basketball: 2,
	football: 3,
	hockey: 2,
});
const getContractValue = (
	contract: PlayerContract,
	normalizedValue: number,
) => {
	const season = g.get("season");
	const phase = g.get("phase");
	if (
		contract.exp === season ||
		(phase > PHASE.PLAYOFFS && contract.exp === season + 1)
	) {
		// Don't care about expiring contracts
		return 0;
	}

	const salaryCap = g.get("salaryCap");
	const normalizedContractAmount = contract.amount / salaryCap;

	const slope =
		(g.get("maxContract") / salaryCap - g.get("minContract") / salaryCap) /
		(MAX_VALUE - MIN_VALUE);

	const expectedAmount = slope * (normalizedValue - MIN_VALUE);

	const contractValue = expectedAmount - normalizedContractAmount;

	// Don't let contract value exceed 0.1, it's just a small boost or a big penalty
	return Math.min(contractValue, 0.1);
};

const getPlayers = async ({
	add,
	remove,
	roster,
	pidsAdd,
	pidsRemove,
	tid,
	tradingPartnerTid,
}: {
	add: Asset[];
	remove: Asset[];
	roster: Asset[];
	pidsAdd: number[];
	pidsRemove: number[];
	tid: number;
	tradingPartnerTid?: number;
}) => {
	const difficultyFudgeFactor = helpers.bound(
		1 + 0.1 * g.get("difficulty"),
		0,
		Infinity,
	); // 2.5% bonus for easy, 2.5% penalty for hard, 10% penalty for insane

	// Fudge factor for AI overvaluing its own players
	const fudgeFactor =
		(tid !== g.get("userTid") && tradingPartnerTid !== g.get("userTid")
			? 1.05
			: 1) * difficultyFudgeFactor;

	// Get roster and players to remove
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);

	for (const p of players) {
		const value = zscore(p.value);

		if (!pidsRemove.includes(p.pid)) {
			roster.push({
				type: "player",
				value,
				contractValue: getContractValue(p.contract, value),
				injury: p.injury,
				age: g.get("season") - p.born.year,
			});
		} else {
			// Only apply fudge factor to positive assets
			let fudgedValue = value;
			if (fudgedValue > 0) {
				fudgedValue *= fudgeFactor;
			}

			remove.push({
				type: "player",
				value: fudgedValue,
				contractValue: getContractValue(p.contract, value),
				injury: p.injury,
				age: g.get("season") - p.born.year,
			});
		}
	}

	// Get players to add
	for (const pid of pidsAdd) {
		const p = await idb.cache.players.get(pid);
		if (p) {
			const value = zscore(p.value);

			add.push({
				type: "player",
				value,
				contractValue: getContractValue(p.contract, value),
				injury: p.injury,
				age: g.get("season") - p.born.year,
			});
		}
	}
};

const getPickNumber = async (
	dp: DraftPick,
	season: number,
	pidsAdd: number[],
	pidsRemove: number[],
	tid: number,
	tradingPartnerTid?: number,
): Promise<number> => {
	const numPicksPerRound = getNumPicksPerRound();

	let estPick: number;
	if (dp.pick > 0) {
		estPick = dp.pick;
	} else {
		let temp = undefined;
		// This first if case will only hit when valueChange is called when determining if a player should re-sign
		// Think the dynamic reevaluation could lead to some unexpected behavior here (maybe teams start letting a
		// lot of players walk to tank their pick/increase overall value) so I'm retaining the old behavior for this case
		if (tradingPartnerTid === undefined) {
			temp = await getModifiedPickRank(tid, [], []);
		} else if (dp.originalTid === tid) {
			temp = await getModifiedPickRank(tid, pidsAdd, pidsRemove);
		} else if (tradingPartnerTid && dp.originalTid === tradingPartnerTid) {
			temp = await getModifiedPickRank(tradingPartnerTid, pidsRemove, pidsAdd);
		} else {
			temp = await getModifiedPickRank(dp.originalTid, [], []);
		}
		estPick = temp !== undefined ? temp : numPicksPerRound / 2;

		// tid rather than originalTid, because it's about what the user can control
		const usersPick = dp.tid === g.get("userTid");

		// Used to know when to overvalue own pick
		const tradeWithUser = tradingPartnerTid === g.get("userTid");

		// For future draft picks, add some uncertainty.
		const regressionTarget = (usersPick ? 0.75 : 0.25) * numPicksPerRound;

		// Never let this improve the future projection of user's picks
		let seasons = helpers.bound(season - g.get("season"), 0, 5);
		if (tradeWithUser && seasons > 0) {
			// When trading with the user, expect things to change rapidly
			seasons = helpers.bound(seasons + 1, 0, 5);
		}

		if (seasons === 0 && g.get("phase") < PHASE.PLAYOFFS) {
			// Would be better to base on fraction of season completed, but oh well
			seasons += 0.5;
		}

		// Weighted average of estPicks and regressionTarget
		estPick = Math.round(
			(estPick * (5 - seasons)) / 5 + (regressionTarget * seasons) / 5,
		);

		if (tradeWithUser && seasons > 0) {
			if (usersPick) {
				// Penalty for user draft picks
				const difficultyFactor = 1 + 1.5 * g.get("difficulty");
				estPick = helpers.bound(
					Math.round((estPick + numPicksPerRound / 3.5) * difficultyFactor),
					1,
					numPicksPerRound,
				);
			} else {
				// Bonus for AI draft picks
				estPick = helpers.bound(
					Math.round(estPick - numPicksPerRound / 3.5),
					1,
					numPicksPerRound,
				);
			}
		}
	}

	estPick += numPicksPerRound * (dp.round - 1);

	return estPick;
};

const getPickInfo = async (
	dp: DraftPick,
	estValues: TradePickValues,
	rookieSalaries: any,
	pidsAdd: number[],
	pidsRemove: number[],
	tid: number,
	tradingPartnerTid?: number,
): Promise<Asset> => {
	const season =
		dp.season === "fantasy" || dp.season === "expansion"
			? g.get("season")
			: dp.season;

	const estPick = await getPickNumber(
		dp,
		season,
		pidsAdd,
		pidsRemove,
		tid,
		tradingPartnerTid,
	);

	let value;
	const valuesTemp = estValues[season];
	if (valuesTemp) {
		value = valuesTemp[estPick - 1];
	}
	if (value === undefined) {
		value = estValues.default[estPick - 1];
	}
	if (value === undefined) {
		value = estValues.default.at(-1);
	}
	if (value === undefined) {
		value = 20;
	}

	value = zscore(value);

	let contractValue = getContractValue(
		{
			amount: rookieSalaries[estPick - 1],
			exp: season + 2,
		},
		value,
	);

	// Since rookies can be cut after the draft, value of a draft pick can't be negative
	value = Math.max(0.1, value);
	contractValue = Math.max(0, contractValue);

	// Ensure there are no tied pick values
	value -= estPick * 1e-10;

	return {
		type: "pick",
		value,
		contractValue,
		injury: {
			type: "Healthy",
			gamesRemaining: 0,
		},

		// Would be better to store age in estValues, but oh well
		age: 20,
		draftPick: estPick,
		draftYear: season,
	};
};

const getPicks = async ({
	add,
	remove,
	pidsAdd,
	pidsRemove,
	dpidsAdd,
	dpidsRemove,
	estValues,
	tid,
	tradingPartnerTid,
}: {
	add: Asset[];
	remove: Asset[];
	pidsAdd: number[];
	pidsRemove: number[];
	dpidsAdd: number[];
	dpidsRemove: number[];
	estValues: TradePickValues;
	tid: number;
	tradingPartnerTid?: number;
}) => {
	// For each draft pick, estimate its value based on the recent performance of the team
	if (dpidsAdd.length > 0 || dpidsRemove.length > 0) {
		const rookieSalaries = draft.getRookieSalaries();

		for (const dpid of dpidsAdd) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				continue;
			}

			const pickInfo = await getPickInfo(
				dp,
				estValues,
				rookieSalaries,
				pidsAdd,
				pidsRemove,
				tid,
				tradingPartnerTid,
			);
			add.push(pickInfo);
		}

		for (const dpid of dpidsRemove) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				continue;
			}

			const pickInfo = await getPickInfo(
				dp,
				estValues,
				rookieSalaries,
				pidsAdd,
				pidsRemove,
				tid,
				tradingPartnerTid,
			);
			remove.push(pickInfo);
		}
	}
};

const EXPONENT = bySport({
	baseball: 3,
	basketball: 7,
	football: 3,
	hockey: 3.5,
});

const sumValues = (
	players: Asset[],
	strategy: string,
	tid: number,
	includeInjuries = false,
) => {
	if (players.length === 0) {
		return 0;
	}

	const season = g.get("season");
	const phase = g.get("phase");

	return players.reduce((memo, p) => {
		let playerValue: number = p.value;

		const treatAsFutureDraftPick =
			p.type === "pick" && (season !== p.draftYear || phase <= PHASE.PLAYOFFS);

		if (strategy === "rebuilding") {
			// Value young/cheap players and draft picks more. Penalize expensive/old players
			if (treatAsFutureDraftPick) {
				playerValue *= 1.1;
			} else if (p.age <= 19) {
				playerValue *= 1.075;
			} else if (p.age === 20) {
				playerValue *= 1.05;
			} else if (p.age === 21) {
				playerValue *= 1.0375;
			} else if (p.age === 22) {
				playerValue *= 1.025;
			} else if (p.age === 23) {
				playerValue *= 1.0125;
			} else if (p.age === 27) {
				playerValue *= 0.975;
			} else if (p.age === 28) {
				playerValue *= 0.95;
			} else if (p.age >= 29) {
				playerValue *= 0.9;
			}
		} else if (strategy === "contending") {
			// Much of the value for these players comes from potential, which we don't really care about
			if (treatAsFutureDraftPick) {
				playerValue *= 0.825;
			} else if (p.age <= 19) {
				playerValue *= 0.8;
			} else if (p.age === 20) {
				playerValue *= 0.825;
			} else if (p.age === 21) {
				playerValue *= 0.85;
			} else if (p.age === 22) {
				playerValue *= 0.875;
			} else if (p.age === 23) {
				playerValue *= 0.925;
			} else if (p.age === 24) {
				playerValue *= 0.95;
			}
		}

		// Normalize for injuries
		if (includeInjuries && tid !== g.get("userTid")) {
			if (p.injury.gamesRemaining > 75) {
				playerValue -= playerValue * 0.75;
			} else {
				playerValue -= (playerValue * p.injury.gamesRemaining) / 100;
			}
		}

		// Really bad players will just get no PT
		if (playerValue < 0) {
			playerValue = 0;
		}

		const contractsFactor = strategy === "rebuilding" ? 2 : 0.5;
		playerValue += contractsFactor * p.contractValue;
		// console.log(playerValue, p);

		return memo + (playerValue > 1 ? playerValue ** EXPONENT : playerValue);
	}, 0);
};

const refreshCache = async () => {
	const playersByTid = groupBy(
		await idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
		"tid",
	);
	const teamOvrs: {
		tid: number;
		ovr: number;
	}[] = [];
	for (const [tidString, players] of Object.entries(playersByTid)) {
		const tid = parseInt(tidString);
		const ovr = team.ovr(
			players.map(p => ({
				pid: p.pid,
				value: p.value,
				ratings: {
					ovr: p.ratings.at(-1)!.ovr,
					ovrs: p.ratings.at(-1)!.ovrs,
					pos: p.ratings.at(-1)!.pos,
				},
			})),
			{
				fast: true,
			},
		);

		teamOvrs.push({ tid, ovr });
	}
	teamOvrs.sort((a, b) => b.ovr - a.ovr);

	const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);

	const allTeamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);

	let gp = 0;

	const wps = teamOvrs.map((teamOvrObj, rank) => {
		const teamOvrWinp =
			0.25 + (0.5 * (teams.length - 1 - rank)) / (teams.length - 1);
		const teamSeasons = allTeamSeasons.filter(
			teamSeason => teamSeason.tid === teamOvrObj.tid,
		);
		let record: [number, number];

		if (teamSeasons.length === 0) {
			// Expansion team?
			record = [0, 0];
		} else {
			const teamSeason = teamSeasons[0];
			record = [teamSeason.won, teamSeason.lost];
		}
		gp = record[0] + record[1];

		const seasonFraction = gp / g.get("numGames");

		// Weighted average of current season record and team rating, based on how much of the current season is complete
		if (gp === 0) {
			return teamOvrWinp;
		}
		return (
			seasonFraction * (record[0] / gp) + (1 - seasonFraction) * teamOvrWinp
		);
	});

	// Get rank order of wps http://stackoverflow.com/a/14834599/786644
	const sorted = wps.slice().sort((a, b) => a - b);

	return {
		estValues: await trade.getPickValues(),
		gp,
		sortedWps: sorted,
		sortedTeamOvrs: teamOvrs.map(o => o.ovr),
	};
};

// tradingPartnerTid is currently just used to determine if this is a trade with the user, so additional fuzz can be applied
const valueChange = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
	valueChangeKey: number = Math.random(),
	tradingPartnerTid?: number,
): Promise<number> => {
	// UGLY HACK: Don't include more than 2 draft picks in a trade for AI team
	if (dpidsRemove.length > 2) {
		return -1;
	}

	await player.updateOvrMeanStd();

	// Get value and skills for each player on team or involved in the proposed transaction
	const roster: Asset[] = [];
	const add: Asset[] = [];
	const remove: Asset[] = [];
	const t = await idb.cache.teams.get(tid);

	if (!t) {
		throw new Error("Invalid team");
	}

	const strategy = t.strategy;

	if (prevValueChangeKey !== valueChangeKey || cache === undefined) {
		cache = await refreshCache();
		prevValueChangeKey = valueChangeKey;
	}

	await getPlayers({
		add,
		remove,
		roster,
		pidsAdd,
		pidsRemove,
		tid,
		tradingPartnerTid,
	});
	await getPicks({
		add,
		remove,
		pidsAdd,
		pidsRemove,
		dpidsAdd,
		dpidsRemove,
		estValues: cache.estValues,
		tid,
		tradingPartnerTid,
	});

	// console.log("ADD");
	const valuesAdd = sumValues(add, strategy, tid, true);
	// console.log("Total", valuesAdd);

	// console.log("REMOVE");
	const valuesRemove = sumValues(remove, strategy, tid);
	// console.log("Total", valuesRemove);

	return valuesAdd - valuesRemove;
};

const getModifiedPickRank = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
) => {
	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsBySeasonTid",
		[tid, g.get("season")],
	);
	const record = teamSeason ? [teamSeason.won, teamSeason.lost] : [0, 0];
	const seasonFraction = cache.gp / g.get("numGames");
	let players = await idb.cache.players.indexGetAll("playersByTid", tid);
	if (pidsAdd.length != 0 || pidsRemove.length != 0) {
		players = players.filter(p => !pidsRemove.includes(p.pid));
		await pidsAdd.forEach(async id => {
			const p = await idb.cache.players.get(id);
			if (p) {
				players.push(p);
			}
		});
	}
	const newTeamOvr = await getTeamOvr(players);
	// potential speed up: use binary search instead of linear search on sorted arrays
	const newTeamOvrRank =
		helpers.binarySearch(cache.sortedTeamOvrs, newTeamOvr) + 1;
	const newTeamOvrWinp =
		0.25 +
		(0.5 * (cache.sortedTeamOvrs.length - 1 - newTeamOvrRank)) /
			(cache.sortedTeamOvrs.length - 1);
	const newWp =
		cache.gp === 0
			? newTeamOvrWinp
			: seasonFraction * (record[0] / cache.gp) +
			  (1 - seasonFraction) * newTeamOvrWinp;
	const newEstPick = helpers.binarySearch(cache.sortedWps, newWp) + 1;
	return newEstPick;
};

export default valueChange;
