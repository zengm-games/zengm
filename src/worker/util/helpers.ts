import orderBy from "lodash/orderBy";
import { PLAYER, helpers as commonHelpers } from "../../common";
import { idb } from "../db";
import g from "./g";
import random from "./random";
import type { DraftPick, PlayoffSeriesTeam } from "../../common/types";
import defaultGameAttributes from "./defaultGameAttributes";

const augmentSeries = async (
	series: {
		away?: PlayoffSeriesTeam;
		home: PlayoffSeriesTeam;
	}[][],
	season: number = g.get("season"),
) => {
	const teamSeasons = await idb.getCopies.teamSeasons({
		season,
	});

	const setAll = (obj: PlayoffSeriesTeam) => {
		obj.abbrev = g.get("teamInfoCache")[obj.tid]?.abbrev;
		obj.region = g.get("teamInfoCache")[obj.tid]?.region;
		obj.imgURL = g.get("teamInfoCache")[obj.tid]?.imgURL;
		obj.regularSeason = {
			won: 0,
			lost: 0,
			tied: g.get("ties", season) ? 0 : undefined,
		};

		const teamSeason = teamSeasons.find(ts => ts.tid === obj.tid);
		if (teamSeason) {
			if (teamSeason.abbrev) {
				obj.abbrev = teamSeason.abbrev;
				obj.region = teamSeason.region;
				obj.imgURL = teamSeason.imgURL;
			}
			obj.regularSeason.won = teamSeason.won;
			obj.regularSeason.lost = teamSeason.lost;

			if (g.get("ties", season)) {
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
	tied?: any;
	won: number;
}) => {
	// Some old leagues had NaN for tied...
	if (typeof tied !== "number" || Number.isNaN(tied)) {
		if (won + lost > 0) {
			return won / (won + lost);
		}

		return 0;
	}

	if (won + lost + tied > 0) {
		return (won + 0.5 * tied) / (won + lost + tied);
	}

	return 0;
};

// Used to fix links in the event log, which will be wrong if a league is exported and then imported. Would be better to do this on import!
const correctLinkLid = (
	lid: number,
	event: {
		text: string;
	},
) => {
	event.text = event.text.replace(/\/l\/\d+\//g, `/l/${lid}/`);
};

const defaultBudgetAmount = (
	popRank: number = g.get("numActiveTeams"),
	salaryCap: number = g.get("salaryCap"),
) => {
	return (
		Math.round(
			20 +
				(salaryCap / 90000) * 1330 +
				(900 * (salaryCap / 90000) * (g.get("numActiveTeams") - popRank)) /
					(g.get("numActiveTeams") - 1),
		) * 10
	);
};

const defaultTicketPrice = (
	popRank: number = g.get("numActiveTeams"),
	salaryCap: number = g.get("salaryCap"),
) => {
	return parseFloat(
		(
			1 +
			(salaryCap / 90000) * 36 +
			(25 * (salaryCap / 90000) * (g.get("numActiveTeams") - popRank)) /
				(g.get("numActiveTeams") - 1)
		).toFixed(2),
	);
};

// Calculate the number of games that team is behind team0
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

	if (tid >= g.get("teamInfoCache").length) {
		tid = g.get("userTid");
	}

	return g.get("teamInfoCache")[tid]?.abbrev;
};

const leagueUrl = (components: (number | string)[]): string =>
	commonHelpers.leagueUrlFactory(g.get("lid"), components);

/**
 * Pad an array with nulls or truncate it so that it has a fixed length.
 *
 * @memberOf util.helpers
 * @param {Array} array Input array.
 * @param {number} length Desired length.
 * @return {Array} Original array padded with null or truncated so that it has the required length.
 */
function zeroPad(array: number[], length: number) {
	if (array.length > length) {
		return array.slice(0, length);
	}

	while (array.length < length) {
		array.push(0);
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

const orderByWinp = <
	T extends {
		seasonAttrs: {
			winp: number;
			won: number;
			did: number;
		};
		tid: number;
	}
>(
	teams: T[],
	season: number = g.get("season"),
): T[] => {
	const defaultFuncs = [
		(t: T) => t.seasonAttrs.winp,
		(t: T) => t.seasonAttrs.won,

		// We want ties to be randomly decided, but consistently so orderByWinp can be called multiple times with a deterministic result
		(t: T) =>
			random.uniformSeed(
				t.tid + season + (t.seasonAttrs.won + t.seasonAttrs.winp),
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
		if (!divisionLeaders.has(t.seasonAttrs.did)) {
			divisionLeaders.set(t.seasonAttrs.did, t.tid);
		}
	}

	return orderBy(
		sortedTeams,
		[
			t => (divisionLeaders.get(t.seasonAttrs.did) === t.tid ? 1 : 0),
			...defaultFuncs,
		],
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
	const season =
		dp.season === "fantasy"
			? "Fantasy draft"
			: dp.season === "expansion"
			? "Expansion draft"
			: dp.season;
	let desc = `${season} ${commonHelpers.ordinal(dp.round)} round pick`;
	const extras: string[] = [];

	if (dp.pick > 0) {
		extras.push(
			commonHelpers.ordinal((dp.round - 1) * g.get("numActiveTeams") + dp.pick),
		);
	}

	if (dp.tid !== dp.originalTid) {
		extras.push(`from ${g.get("teamInfoCache")[dp.originalTid]?.abbrev}`);
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
	for (const key of commonHelpers.keys(g)) {
		if (key !== "lid" && typeof g[key] !== "function") {
			delete g[key];
		}
	}
};

// x is value, a controls sharpness, b controls center
const sigmoid = (x: number, a: number, b: number): number => {
	return 1 / (1 + Math.exp(-(a * (x - b))));
};

const quarterLengthFactor = () => {
	if (g.get("quarterLength") <= 0) {
		return 1;
	}

	return Math.sqrt(
		g.get("quarterLength") / defaultGameAttributes.quarterLength,
	);
};

const helpers = {
	...commonHelpers,
	augmentSeries,
	calcWinp,
	correctLinkLid,
	defaultBudgetAmount,
	defaultTicketPrice,
	gb,
	getAbbrev,
	leagueUrl,
	zeroPad,
	numGamesToWinSeries,
	orderByWinp,
	overtimeCounter,
	pickDesc,
	quarterLengthFactor,
	resetG,
	sigmoid,
};

export default helpers;
