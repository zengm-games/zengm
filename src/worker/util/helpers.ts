import { PLAYER, helpers as commonHelpers } from "../../common";
import { idb } from "../db";
import g from "./g";
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
			otl: g.get("otl", season) ? 0 : undefined,
		};

		const imgURLSmall = g.get("teamInfoCache")[obj.tid]?.imgURLSmall;
		if (imgURLSmall) {
			obj.imgURLSmall = imgURLSmall;
		}

		const teamSeason = teamSeasons.find(ts => ts.tid === obj.tid);
		if (teamSeason) {
			if (teamSeason.abbrev) {
				obj.abbrev = teamSeason.abbrev;
				obj.region = teamSeason.region;
				obj.imgURL = teamSeason.imgURL;
				obj.imgURLSmall = teamSeason.imgURLSmall;
			}
			obj.regularSeason.won = teamSeason.won;
			obj.regularSeason.lost = teamSeason.lost;

			if (g.get("ties", season)) {
				obj.regularSeason.tied = teamSeason.tied;
			}
			if (g.get("otl", season)) {
				obj.regularSeason.otl = teamSeason.otl;
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
	otl,
	tied,
	won,
}: {
	lost: number;
	otl?: any;
	tied?: any;
	won: number;
}) => {
	const actualOtl = typeof otl !== "number" || Number.isNaN(otl) ? 0 : otl;
	const actualLost = lost + actualOtl;

	// Some old leagues had NaN for tied...
	if (typeof tied !== "number" || Number.isNaN(tied)) {
		if (won + actualLost > 0) {
			return won / (won + actualLost);
		}

		return 0;
	}

	if (won + actualLost + tied > 0) {
		return (won + 0.5 * tied) / (won + actualLost + tied);
	}

	return 0;
};

// Used to fix links in the event log, which will be wrong if a league is exported and then imported. Would be better to do this on import!
const correctLinkLid = (lid: number, text: string) => {
	return text.replace(/\/l\/\d+\//g, `/l/${lid}/`);
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

	if (tid === PLAYER.DOES_NOT_EXIST) {
		return "DNE";
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

const leagueUrl = (components: (number | string | undefined)[]): string =>
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

const pickDesc = (dp: DraftPick, short?: "short"): string => {
	const season =
		dp.season === "fantasy"
			? "Fantasy draft"
			: dp.season === "expansion"
			? "Expansion draft"
			: dp.season;

	const extras: string[] = [];

	if (dp.pick > 0) {
		extras.push(
			commonHelpers.ordinal((dp.round - 1) * g.get("numActiveTeams") + dp.pick),
		);
	}

	if (dp.tid !== dp.originalTid) {
		extras.push(`from ${g.get("teamInfoCache")[dp.originalTid]?.abbrev}`);
	}

	let desc = `${season} ${commonHelpers.ordinal(dp.round)}`;
	if (extras.length === 0 || !short) {
		desc += " round pick";
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

// Make it a multiple of 10k
const roundContract = (amount: number) => 10 * Math.round(amount / 10);

// x is value, a controls sharpness, b controls center
const sigmoid = (x: number, a: number, b: number): number => {
	return 1 / (1 + Math.exp(-(a * (x - b))));
};

const quarterLengthFactor = () => {
	if (g.get("quarterLength") <= 0) {
		return 1;
	}

	// sqrt is to account for fatigue in short/long games. Also https://news.ycombinator.com/item?id=11032596
	return Math.sqrt(
		(g.get("numPeriods") * g.get("quarterLength")) /
			(defaultGameAttributes.numPeriods * defaultGameAttributes.quarterLength),
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
	overtimeCounter,
	pickDesc,
	quarterLengthFactor,
	resetG,
	roundContract,
	sigmoid,
};

export default helpers;
