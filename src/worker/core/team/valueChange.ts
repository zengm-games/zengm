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
import regression, { DataPoint, Result } from "regression";

type Asset =
	| {
			type: "player";
			value: number;
			contractValue: number;
			injury: PlayerInjury;
			age: number;
			justDrafted: boolean;
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
	ovrToRankModel: Result;
	estValues: TradePickValues;
	cachedEstimatedPicks: {
		addAssetKey?: number;
		t1ID?: number;
		t1Pick?: number;
		t2ID?: number;
		t2Pick?: number;
	};
};

// Source: https://stackoverflow.com/questions/55725139/fit-sigmoid-function-s-shape-curve-to-data-using-python
// This "win% to team ranking" is specific to basketball
// I can run different simulations for the other sports to have models that more accurately represent
// those leagues
const winPToPick = (winP: number) => {
	const L = 1.0687820005007198;
	const x0 = 0.4878517508315021;
	const k = 10.626956987806935;
	const b = -0.038756647038824504;
	const numPicksPerRound = getNumPicksPerRound();
	return helpers.bound(
		numPicksPerRound * (L / (1 + Math.exp(-k * (winP - x0))) + b),
		1,
		numPicksPerRound,
	);
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
				justDrafted: helpers.justDrafted(p, g.get("phase"), g.get("season")),
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
				justDrafted: helpers.justDrafted(p, g.get("phase"), g.get("season")),
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
				justDrafted: helpers.justDrafted(p, g.get("phase"), g.get("season")),
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
	addAssetKey?: number,
): Promise<number> => {
	const numPicksPerRound = getNumPicksPerRound();

	let estPick: number;
	if (dp.pick > 0) {
		estPick = dp.pick;
	} else {
		if (tradingPartnerTid === undefined) {
			// This first if case will only hit when valueChange is called to determine if a team should re-sign a player
			// Think dynamic pick re-evaluation could lead to some unexpected behavior here (teams end up letting a
			// lot of players walk to tank their pick/increase overall value) so the old behavior is retained for this case
			estPick = await getModifiedPickRank(tid, [], []);
		} else if (dp.originalTid === tid) {
			// If this draft pick belongs to the team evaluating the trade, re-evaluate it taking into account the new players
			// on the team
			estPick = await getModifiedPickRank(
				tid,
				pidsAdd,
				pidsRemove,
				addAssetKey,
			);
		} else if (dp.originalTid === tradingPartnerTid) {
			// If this draft pick belongs to the team proposing the trade, the CPU should calculate that
			// the pick its receiving could change in value given the players changing hands
			estPick = await getModifiedPickRank(
				tradingPartnerTid,
				pidsRemove,
				pidsAdd,
				addAssetKey,
			);
		} else {
			// This pick is unrelated to the team involved in the trade, so don't take player exchanges into account
			// TODO: incorporate this into cache
			estPick = await getModifiedPickRank(dp.originalTid, [], []);
		}

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
	addAssetKey?: number,
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
		addAssetKey,
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
	addAssetKey,
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
	addAssetKey?: number;
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
				addAssetKey,
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
				addAssetKey,
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

		// if a player was just drafted and can be released, they shouldn't have negative value
		if (p.type == "player" && p.justDrafted) {
			playerValue = Math.max(0, playerValue);
		}

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

	const teamRanks: DataPoint[] = teamOvrs.map((team, index) => [
		team.ovr,
		index + 1,
	]);
	// generate a function using linear regression that maps team ovr -> estimated team rank
	const ovrToRankModel = regression.linear(teamRanks);

	return {
		ovrToRankModel,
		estValues: await trade.getPickValues(),
		cachedEstimatedPicks: {},
	};
};

// tradingPartnerTid is currently just used to determine if this is a trade with the user, so additional fuzz can be applied
const valueChange = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
	tradingPartnerTid?: number,
	addAssetKey?: number,
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

	if (prevValueChangeKey !== g.get("season") || cache === undefined) {
		cache = await refreshCache();
		prevValueChangeKey = g.get("season");
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
		addAssetKey,
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
	addAssetKey?: number,
) => {
	if (
		addAssetKey != undefined &&
		addAssetKey === cache.cachedEstimatedPicks.addAssetKey
	) {
		if (tid === cache.cachedEstimatedPicks.t1ID) {
			return cache.cachedEstimatedPicks.t1Pick!;
		} else if (tid === cache.cachedEstimatedPicks.t2ID) {
			return cache.cachedEstimatedPicks.t2Pick!;
		}
	}
	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsBySeasonTid",
		[tid, g.get("season")],
	);
	const teams = g.get("numActiveTeams");
	const record = teamSeason ? [teamSeason.won, teamSeason.lost] : [0, 0];
	const gp = record[0] + record[1];
	const seasonFraction = gp / g.get("numGames");
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	let playerRatings = players.map(p => ({
		pid: p.pid,
		value: p.value,
		ratings: {
			ovr: p.ratings.at(-1)!.ovr,
			ovrs: p.ratings.at(-1)!.ovrs,
			pos: p.ratings.at(-1)!.pos,
		},
	}));
	if (pidsRemove.length != 0) {
		playerRatings = playerRatings.filter(p => !pidsRemove.includes(p.pid));
	}
	if (pidsAdd.length != 0) {
		for (const pid of pidsAdd) {
			const p = await idb.cache.players.get(pid);
			if (p) {
				playerRatings.push({
					pid: p.pid,
					value: p.value,
					ratings: {
						ovr: p.ratings.at(-1)!.ovr,
						ovrs: p.ratings.at(-1)!.ovrs,
						pos: p.ratings.at(-1)!.pos,
					},
				});
			}
		}
	}
	const newTeamOvr = team.ovr(playerRatings, { fast: true });
	const newTeamOvrRank = helpers.bound(
		cache.ovrToRankModel.predict(newTeamOvr)[1],
		1,
		teams,
	);
	const newTeamOvrWinp = 0.25 + (0.5 * (teams - 1 - newTeamOvrRank)) / teams;
	const newWp =
		gp === 0
			? newTeamOvrWinp
			: seasonFraction * (record[0] / gp) +
			  (1 - seasonFraction) * newTeamOvrWinp;
	const newEstPick = winPToPick(newWp);
	if (addAssetKey != undefined) {
		if (cache.cachedEstimatedPicks.addAssetKey === addAssetKey) {
			cache.cachedEstimatedPicks = {
				t2ID: tid,
				t2Pick: newEstPick,
				...cache.cachedEstimatedPicks,
			};
		} else {
			cache.cachedEstimatedPicks = {
				addAssetKey,
				t1ID: tid,
				t1Pick: newEstPick,
			};
		}
	}
	return newEstPick;
};

export default valueChange;
