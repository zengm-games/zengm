import orderBy from "lodash/orderBy";
import { PLAYER, helpers as commonHelpers } from "../../common";
import { idb } from "../db";
import g from "./g";
import random from "./random";
import {
	DraftPick,
	GameProcessed,
	GameProcessedCompleted,
	PlayoffSeriesTeam,
	TeamSeason,
} from "../../common/types";

const augmentSeries = async (
	series: {
		away?: PlayoffSeriesTeam;
		home: PlayoffSeriesTeam;
	}[][],
	season: number = g.season,
) => {
	const teams = await idb.cache.teams.getAll();
	const teamSeasons = await idb.getCopies.teamSeasons({
		season,
	});

	const setAll = obj => {
		obj.abbrev = g.teamAbbrevsCache[obj.tid];
		obj.region = g.teamRegionsCache[obj.tid];
		obj.imgURL = teams[obj.tid].imgURL;
		const teamSeason = teamSeasons[obj.tid];
		obj.regularSeason = {
			won: 0,
			lost: 0,
			tied: g.ties ? 0 : undefined,
		};

		if (teamSeason) {
			obj.regularSeason.won = teamSeason.won;
			obj.regularSeason.lost = teamSeason.lost;

			if (g.ties) {
				obj.regularSeason.tied = teamSeason.tied;
			}
		}
	};

	for (const round of series) {
		for (const matchup of round) {
			if (matchup.away) {
				setAll(matchup.away);
			}

			setAll(matchup.home);
		}
	}
};

const calcWinp = ({
	lost,
	tied,
	won,
}: {
	lost: number;
	tied: any;
	won: number;
}) => {
	if (!g.ties || typeof tied !== "number") {
		if (won + lost > 0) {
			return won / (won + lost);
		}

		return 0;
	}

	if (won + lost + tied > 0) {
		return (won + 0.5 * tied) / (won + lost + tied);
	}

	return 0;
}; // Used to fix links in the event log, which will be wrong if a league is exported and then imported. Would be better to do this on import!

const correctLinkLid = (
	lid: number,
	event: {
		text: string;
	},
) => {
	event.text = event.text.replace(/\/l\/\d+\//g, `/l/${lid}/`);
};

const defaultBudgetAmount = (popRank: number) => {
	return (
		Math.round(
			(g.salaryCap / 90000) * 1350 +
				(900 * (g.numTeams - popRank)) / (g.numTeams - 1),
		) * 10
	);
};

const defaultTicketPrice = (popRank: number) => {
	return parseFloat(
		(
			(g.salaryCap / 90000) * 37 +
			(25 * (g.numTeams - popRank)) / (g.numTeams - 1)
		).toFixed(2),
	);
};

const formatCompletedGame = (game: GameProcessed): GameProcessedCompleted => {
	// If not specified, assume user's team is playing
	game.tid = game.tid !== undefined ? game.tid : g.userTid; // team0 and team1 are different than they are above! Here it refers to user and opponent, not home and away

	const team0 = {
		tid: game.tid,
		abbrev: g.teamAbbrevsCache[game.tid],
		region: g.teamRegionsCache[game.tid],
		name: g.teamNamesCache[game.tid],
		pts: game.pts,
	};
	const team1 = {
		tid: game.oppTid,
		abbrev: g.teamAbbrevsCache[game.oppTid],
		region: g.teamRegionsCache[game.oppTid],
		name: g.teamNamesCache[game.oppTid],
		pts: game.oppPts,
	};
	return {
		gid: game.gid,
		overtime: game.overtime,
		result: game.result,
		score:
			game.result === "W"
				? `${team0.pts}-${team1.pts}`
				: `${team1.pts}-${team0.pts}`,
		teams: game.home ? [team1, team0] : [team0, team1],
	};
}; // Calculate the number of games that team is behind team0

type teamWonLost = {
	lost: number;
	won: number;
};

const gb = (team0: teamWonLost, team: teamWonLost) => {
	return (team0.won - team0.lost - (team.won - team.lost)) / 2;
};

/**
 * Get the team abbreviation for a team ID.
 *
 * For instance, team ID 0 is Atlanta, which has an abbreviation of ATL.
 *
 * @memberOf util.helpers
 * @param {number|string} tid Integer team ID.
 * @return {string} Abbreviation
 */
const getAbbrev = (tid: number | string): string => {
	if (typeof tid === "string") {
		tid = parseInt(tid, 10);
	}

	if (tid === PLAYER.FREE_AGENT) {
		return "FA";
	}

	if (tid === PLAYER.UNDRAFTED) {
		return "DP";
	}

	if (tid < 0 || Number.isNaN(tid)) {
		// Weird or retired
		return "";
	}

	if (tid >= g.teamAbbrevsCache.length) {
		tid = g.userTid;
	}

	return g.teamAbbrevsCache[tid];
}; // Prefer this to addPopRank in new code because it's not mutable

const getPopRanks = (teamSeasons: TeamSeason[]): number[] => {
	// Add popRank
	const teamsSorted = teamSeasons.slice();
	teamsSorted.sort((a, b) => b.pop - a.pop);
	const popRanks: number[] = [];

	for (let i = 0; i < teamSeasons.length; i++) {
		for (let j = 0; j < teamsSorted.length; j++) {
			if (teamSeasons[i].tid === teamsSorted[j].tid) {
				popRanks[i] = j + 1;
				break;
			}
		}
	}

	return popRanks;
};

const leagueUrl = (components: (number | string)[]): string =>
	commonHelpers.leagueUrlFactory(g.lid, components);

/**
 * Pad an array with nulls or truncate it so that it has a fixed length.
 *
 * @memberOf util.helpers
 * @param {Array} array Input array.
 * @param {number} length Desired length.
 * @return {Array} Original array padded with null or truncated so that it has the required length.
 */
function nullPad<T>(
	array: (T | undefined | null)[],
	length: number,
): (T | undefined | null)[] {
	if (array.length > length) {
		return array.slice(0, length);
	}

	while (array.length < length) {
		array.push(null);
	}

	return array;
}

const numGamesToWinSeries = (numGamesPlayoffSeries: number | undefined) => {
	if (
		typeof numGamesPlayoffSeries !== "number" ||
		Number.isNaN(numGamesPlayoffSeries)
	) {
		return 4;
	}

	return Math.ceil(numGamesPlayoffSeries / 2);
};

const orderByWinp = <T extends any>(
	teams: T[],
	season: number = g.season,
): T[] => {
	const defaultFuncs = [
		t => (t.seasonAttrs ? t.seasonAttrs.winp : 0),
		t => (t.seasonAttrs ? t.seasonAttrs.won : 0), // We want ties to be randomly decided, but consistently so orderByWinp can be called multiple times with a deterministic result
		t =>
			random.uniformSeed(
				t.tid +
					season +
					(t.seasonAttrs ? t.seasonAttrs.won + t.seasonAttrs.winp : 0),
			),
	];
	const defaultOrders: Array<"asc" | "desc"> = ["desc", "desc", "asc"];
	const sortedTeams = orderBy(teams, defaultFuncs, defaultOrders);

	if (process.env.SPORT === "basketball") {
		return sortedTeams;
	}

	// For football, sort by division leaders first
	const divisionLeaders = new Map<number, number>();

	for (const t of sortedTeams) {
		if (!divisionLeaders.has(t.did)) {
			divisionLeaders.set(t.did, t.tid);
		}
	}

	return orderBy(
		sortedTeams,
		[t => (divisionLeaders.get(t.did) === t.tid ? 1 : 0), ...defaultFuncs],
		["desc", ...defaultOrders],
	);
};

const overtimeCounter = (n: number): string => {
	switch (n) {
		case 1:
			return "";

		case 2:
			return "double";

		case 3:
			return "triple";

		case 4:
			return "quadruple";

		case 5:
			return "quintuple";

		case 6:
			return "sextuple";

		case 7:
			return "septuple";

		case 8:
			return "octuple";

		default:
			return `a ${commonHelpers.ordinal(n)}`;
	}
};

const pickDesc = (dp: DraftPick): string => {
	const season = dp.season === "fantasy" ? "Fantasy draft" : dp.season;
	let desc = `${season} ${commonHelpers.ordinal(dp.round)} round pick`;
	const extras: string[] = [];

	if (dp.pick > 0) {
		extras.push(commonHelpers.ordinal((dp.round - 1) * g.numTeams + dp.pick));
	}

	if (dp.tid !== dp.originalTid) {
		extras.push(`from ${g.teamAbbrevsCache[dp.originalTid]}`);
	}

	if (extras.length > 0) {
		desc += ` (${extras.join(", ")})`;
	}

	return desc;
};

/**
 * Delete all the things from the global variable g that are not stored in league databases.
 *
 * This is used to clear out values from other leagues, to ensure that the appropriate values are updated in the database when calling league.setGameAttributes.
 *
 * @memberOf util.helpers
 */
const resetG = () => {
	for (const key of Object.keys(g)) {
		if (key !== "lid") {
			delete g[key];
		}
	}
}; // x is value, a controls sharpness, b controls center

const sigmoid = (x: number, a: number, b: number): number => {
	return 1 / (1 + Math.exp(-(a * (x - b))));
};

const helpers = {
	...commonHelpers,
	augmentSeries,
	calcWinp,
	correctLinkLid,
	defaultBudgetAmount,
	defaultTicketPrice,
	formatCompletedGame,
	gb,
	getAbbrev,
	getPopRanks,
	leagueUrl,
	nullPad,
	numGamesToWinSeries,
	orderByWinp,
	overtimeCounter,
	pickDesc,
	resetG,
	sigmoid,
};

export default helpers;
