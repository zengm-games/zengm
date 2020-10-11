import countBy from "lodash/countBy";
import { PHASE } from "../../../common";
import { draft, player, trade } from "..";
import { idb } from "../../db";
import { g, helpers, local } from "../../util";
import type {
	TradePickValues,
	PlayerContract,
	PlayerInjury,
	DraftPick,
} from "../../../common/types";
import getPayroll from "./getPayroll";

type Asset = {
	value: number;
	contract: PlayerContract;
	injury: PlayerInjury;
	age: number;
	draftPick?: number;
};

let prevValueChangeKey: number | undefined;
let cache: {
	estPicks: Record<number, number | undefined>;
	estValues: TradePickValues;
	gp: number;
};

const zscore = (value: number) =>
	(value - local.playerOvrMean) / local.playerOvrStd;

const getPlayers = async ({
	add,
	remove,
	roster,
	pidsAdd,
	pidsRemove,
	difficultyFudgeFactor,
	tid,
}: {
	add: Asset[];
	remove: Asset[];
	roster: Asset[];
	pidsAdd: number[];
	pidsRemove: number[];
	difficultyFudgeFactor: number;
	tid: number;
}) => {
	// Fudge factor for AI overvaluing its own players
	const fudgeFactor =
		(tid !== g.get("userTid") ? 1.05 : 1) * difficultyFudgeFactor;

	// Get roster and players to remove
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);

	for (const p of players) {
		let value = zscore(p.value);

		if (!pidsRemove.includes(p.pid)) {
			roster.push({
				value,
				contract: p.contract,
				injury: p.injury,
				age: g.get("season") - p.born.year,
			});
		} else {
			// Only apply fudge factor to positive assets
			if (value > 0) {
				value *= fudgeFactor;
			}

			remove.push({
				value,
				contract: p.contract,
				injury: p.injury,
				age: g.get("season") - p.born.year,
			});
		}
	}

	// Get players to add
	for (const pid of pidsAdd) {
		const p = await idb.cache.players.get(pid);
		if (p) {
			add.push({
				value: zscore(p.value),
				contract: p.contract,
				injury: p.injury,
				age: g.get("season") - p.born.year,
			});
		}
	}
};

const getPickNumber = (dp: DraftPick, season: number) => {
	let estPick: number;
	if (dp.pick > 0) {
		estPick = dp.pick;
	} else {
		const temp = cache.estPicks[dp.originalTid];
		estPick = temp !== undefined ? temp : g.get("numActiveTeams") / 2;

		// For future draft picks, add some uncertainty. Weighted average of estPicks and numTeams/2
		const seasons = helpers.bound(season - g.get("season"), 0, 5);
		estPick = Math.round(
			(estPick * (5 - seasons)) / 5 +
				((g.get("numActiveTeams") / 2) * seasons) / 5,
		);

		if (dp.originalTid === g.get("userTid")) {
			// Penalty for user draft picks
			const difficultyFactor = 1 + 1.5 * g.get("difficulty");
			estPick = helpers.bound(
				Math.round(estPick + g.get("numActiveTeams") / 3) * difficultyFactor,
				1,
				g.get("numActiveTeams"),
			);
		} else {
			// Bonus for AI draft picks
			estPick = helpers.bound(
				Math.round(estPick - g.get("numActiveTeams") / 4),
				1,
				g.get("numActiveTeams"),
			);
		}
	}

	estPick += g.get("numActiveTeams") * (dp.round - 1);

	return estPick;
};

const getPickInfo = (
	dp: DraftPick,
	estValues: TradePickValues,
	rookieSalaries: any,
): Asset => {
	const season =
		dp.season === "fantasy" || dp.season === "expansion"
			? g.get("season")
			: dp.season;

	const estPick = getPickNumber(dp, season);

	let value;
	const valuesTemp = estValues[season];
	if (valuesTemp) {
		value = valuesTemp[estPick - 1];
	}
	if (value === undefined) {
		value = estValues.default[estPick - 1];
	}
	if (value === undefined) {
		throw new Error("Undefined value");
	}

	value = zscore(value);

	return {
		value,
		contract: {
			amount: rookieSalaries[estPick - 1],
			exp: season + 2 + (2 - dp.round), // 3 for first round, 2 for second
		},
		injury: {
			type: "Healthy",
			gamesRemaining: 0,
		},
		age: 20,
		draftPick: estPick,
	};
};

const getPicks = async ({
	add,
	remove,
	dpidsAdd,
	dpidsRemove,
	estValues,
}: {
	add: Asset[];
	remove: Asset[];
	dpidsAdd: number[];
	dpidsRemove: number[];
	estValues: TradePickValues;
}) => {
	// For each draft pick, estimate its value based on the recent performance of the team
	if (dpidsAdd.length > 0 || dpidsRemove.length > 0) {
		const rookieSalaries = draft.getRookieSalaries();

		for (const dpid of dpidsAdd) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				continue;
			}

			const pickInfo = getPickInfo(dp, estValues, rookieSalaries);
			add.push(pickInfo);
		}

		for (const dpid of dpidsRemove) {
			const dp = await idb.cache.draftPicks.get(dpid);
			if (!dp) {
				continue;
			}

			const pickInfo = getPickInfo(dp, estValues, rookieSalaries);
			remove.push(pickInfo);
		}
	}
};

// This actually doesn't do anything because I'm an idiot
const base = 3;

const sumValues = (
	players: Asset[],
	gpAvg: number,
	strategy: string,
	tid: number,
	includeInjuries = false,
) => {
	if (players.length === 0) {
		return 0;
	}

	return players.reduce((memo, p) => {
		let playerValue = p.value;

		if (strategy === "rebuilding") {
			// Value young/cheap players and draft picks more. Penalize expensive/old players
			if (p.draftPick !== undefined) {
				playerValue *= 1.15;
			} else if (p.age <= 19) {
				playerValue *= 1.15;
			} else if (p.age === 20) {
				playerValue *= 1.1;
			} else if (p.age === 21) {
				playerValue *= 1.075;
			} else if (p.age === 22) {
				playerValue *= 1.05;
			} else if (p.age === 23) {
				playerValue *= 1.025;
			} else if (p.age === 27) {
				playerValue *= 0.975;
			} else if (p.age === 28) {
				playerValue *= 0.95;
			} else if (p.age >= 29) {
				playerValue *= 0.9;
			}
		} else if (strategy === "contending") {
			// Much of the value for these players comes from potential, which we don't really care about
			if (p.draftPick !== undefined) {
				playerValue *= 0.75;
			} else if (p.age <= 19) {
				playerValue *= 0.85;
			} else if (p.age === 20) {
				playerValue *= 0.9;
			} else if (p.age === 21) {
				playerValue *= 0.925;
			} else if (p.age === 22) {
				playerValue *= 0.95;
			} else if (p.age === 23) {
				playerValue *= 0.975;
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
		console.log(playerValue, p);

		return memo + playerValue ** base;
	}, 0);
};

// Sum of contracts
// If onlyThisSeason is set, then amounts after this season are ignored and the return value is the sum of this season's contract amounts in millions of dollars
const sumContracts = (
	players: Asset[],
	gpAvg: number,
	onlyThisSeason = false,
) => {
	if (players.length === 0) {
		return 0;
	}

	return players.reduce((memo, p) => {
		if (p.draftPick !== undefined) {
			return memo;
		}

		return (
			memo +
			(p.contract.amount / 1000) *
				player.contractSeasonsRemaining(
					p.contract.exp,
					g.get("numGames") - gpAvg,
				) **
					(0.25 - (onlyThisSeason ? 0.25 : 0))
		);
	}, 0);
};

const refreshCache = async () => {
	const teams = (await idb.cache.teams.getAll()).filter(t => !t.disabled);

	const allTeamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season") - 1], [g.get("season"), "Z"]],
	);

	let gp = 0;

	// Estimate the order of the picks by team
	const wps = teams.map(t => {
		const teamSeasons = allTeamSeasons.filter(
			teamSeason => teamSeason.tid === t.tid,
		);
		const s = teamSeasons.length;
		let rCurrent;
		let rLast;

		if (teamSeasons.length === 0) {
			// Expansion team?
			rCurrent = [
				Math.round(0.2 * g.get("numGames")),
				Math.round(0.8 * g.get("numGames")),
			];
			rLast = [
				Math.round(0.2 * g.get("numGames")),
				Math.round(0.8 * g.get("numGames")),
			];
		} else if (teamSeasons.length === 1) {
			// First season
			if (teamSeasons[0].won + teamSeasons[0].lost > 15) {
				rCurrent = [teamSeasons[0].won, teamSeasons[0].lost];
			} else {
				// Fix for new leagues - don't base this on record until we have some games played, and don't let the user's picks be overvalued
				rCurrent =
					t.tid === g.get("userTid")
						? [g.get("numGames"), 0]
						: [0, g.get("numGames")];
			}

			if (t.tid === g.get("userTid")) {
				rLast = [
					Math.round(0.6 * g.get("numGames")),
					Math.round(0.4 * g.get("numGames")),
				];
			} else {
				// Assume a losing season to minimize bad trades
				rLast = [
					Math.round(0.4 * g.get("numGames")),
					Math.round(0.6 * g.get("numGames")),
				];
			}
		} else {
			// Second (or higher) season
			rCurrent = [teamSeasons[s - 1].won, teamSeasons[s - 1].lost];
			rLast = [teamSeasons[s - 2].won, teamSeasons[s - 2].lost];
		}

		gp = rCurrent[0] + rCurrent[1]; // Might not be "real" games played

		// If we've played half a season, just use that as an estimate. Otherwise, take a weighted sum of this and last year
		const halfSeason = Math.round(0.5 * g.get("numGames"));

		if (gp >= halfSeason) {
			return rCurrent[0] / gp;
		}
		if (gp > 0) {
			return (
				((gp / halfSeason) * rCurrent[0]) / gp +
				(((halfSeason - gp) / halfSeason) * rLast[0]) / g.get("numGames")
			);
		}
		return rLast[0] / g.get("numGames");
	});

	// Get rank order of wps http://stackoverflow.com/a/14834599/786644
	const sorted = wps.slice().sort((a, b) => a - b);

	// For each team, what is their estimated draft position?
	const estPicks: Record<number, number | undefined> = {};
	for (let i = 0; i < teams.length; i++) {
		const wp = wps[i];
		const rank = sorted.indexOf(wp) + 1;
		estPicks[teams[i].tid] = rank;
	}

	return {
		estPicks,
		estValues: await trade.getPickValues(),
		gp,
	};
};

const valueChange = async (
	tid: number,
	pidsAdd: number[],
	pidsRemove: number[],
	dpidsAdd: number[],
	dpidsRemove: number[],
	valueChangeKey: number = Math.random(),
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
	const teamStats = await idb.cache.teamStats.indexGet(
		"teamSeasonsByTidSeason",
		[tid, g.get("season")],
	);

	if (!t) {
		throw new Error("Invalid team");
	}

	const strategy = t.strategy;
	const gpAvg = helpers.bound(
		teamStats ? teamStats.gp : 0,
		0,
		g.get("numGames"),
	); // Ideally would be done separately for each team, but close enough

	const payroll = await getPayroll(tid);
	const difficultyFudgeFactor = helpers.bound(
		1 + 0.1 * g.get("difficulty"),
		0,
		Infinity,
	); // 2.5% bonus for easy, 2.5% penalty for hard, 10% penalty for insane

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
		difficultyFudgeFactor,
		tid,
	});
	await getPicks({
		add,
		remove,
		dpidsAdd,
		dpidsRemove,
		estValues: cache.estValues,
	});

	const contractsFactor = strategy === "rebuilding" ? 0.3 : 0.1;
	const salaryRemoved = sumContracts(remove, gpAvg) - sumContracts(add, gpAvg);

	console.log("ADD");
	const valuesAdd = sumValues(add, gpAvg, strategy, tid, true);
	console.log("Total", valuesAdd);

	console.log("REMOVE");
	const valuesRemove = sumValues(remove, gpAvg, strategy, tid);
	console.log("Total", valuesRemove);

	let dv = valuesAdd - valuesRemove;
	/*console.log("Added players/picks: " + sumValues(add, true));
  console.log("Removed players/picks: " + (-sumValues(remove)));
  console.log("Added contract quality: -" + contractExcessFactor + " * " + sumContractExcess(add));
  console.log("Removed contract quality: -" + contractExcessFactor + " * " + sumContractExcess(remove));
  console.log("Total contract amount: " + contractsFactor + " * " + salaryRemoved);*/

	return dv;

	// Aversion towards losing cap space in a trade during free agency
	if (
		g.get("phase") >= PHASE.RESIGN_PLAYERS ||
		g.get("phase") <= PHASE.FREE_AGENCY
	) {
		// Only care if cap space is over 2 million
		if (payroll + 2000 < g.get("salaryCap")) {
			const salaryAddedThisSeason =
				sumContracts(add, gpAvg, true) - sumContracts(remove, gpAvg, true); // Only care if cap space is being used

			if (salaryAddedThisSeason > 0) {
				//console.log("Free agency penalty: -" + (0.2 + 0.8 * g.get("daysLeft") / 30) * salaryAddedThisSeason);
				dv -= (0.2 + (0.8 * g.get("daysLeft")) / 30) * salaryAddedThisSeason; // 0.2 to 1 times the amount, depending on stage of free agency
			}
		}
	}

	// Normalize for number of players, since 1 really good player is much better than multiple mediocre ones
	// This is a fudge factor, since it's one-sided to punish the player
	if (add.length > remove.length) {
		dv -= add.length - remove.length;
	}

	return dv;
	/*console.log('---');
  console.log([sumValues(add), sumContracts(add)]);
  console.log([sumValues(remove), sumContracts(remove)]);
  console.log(dv);*/
};

export default valueChange;
