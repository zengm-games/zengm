import {
	PLAYER,
	helpers as commonHelpers,
	timeBetweenGames,
	isSport,
} from "../../common/index.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import type {
	ByConf,
	DraftPick,
	PlayoffSeriesTeam,
} from "../../common/types.ts";
import defaultGameAttributes from "../../common/defaultGameAttributes.ts";
import hasTies from "../core/season/hasTies.ts";
import { roundContract as roundContractRaw } from "../../common/roundContract.ts";

const augmentSeries = async (
	series: {
		away?: PlayoffSeriesTeam;
		home: PlayoffSeriesTeam;
	}[][],
	season: number = g.get("season"),
) => {
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			season,
		},
		"noCopyCache",
	);

	const ties = hasTies(season);

	const setAll = (obj: PlayoffSeriesTeam) => {
		obj.abbrev = g.get("teamInfoCache")[obj.tid]?.abbrev;
		obj.region = g.get("teamInfoCache")[obj.tid]?.region;
		obj.imgURL = g.get("teamInfoCache")[obj.tid]?.imgURL;
		obj.regularSeason = {
			won: 0,
			lost: 0,
			tied: ties ? 0 : undefined,
			otl: g.get("otl", season) ? 0 : undefined,
		};

		const imgURLSmall = g.get("teamInfoCache")[obj.tid]?.imgURLSmall;
		if (imgURLSmall) {
			obj.imgURLSmall = imgURLSmall;
		}

		const teamSeason = teamSeasons.find((ts) => ts.tid === obj.tid);
		if (teamSeason) {
			if (teamSeason.abbrev) {
				obj.abbrev = teamSeason.abbrev;
				obj.region = teamSeason.region;
				obj.imgURL = teamSeason.imgURL;
				obj.imgURLSmall = teamSeason.imgURLSmall;
			}
			obj.regularSeason.won = teamSeason.won;
			obj.regularSeason.lost = teamSeason.lost;

			if (ties) {
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

const defaultTicketPrice = (
	popRank: number = g.get("numActiveTeams"),
	salaryCap: number = g.get("salaryCap"),
) => {
	return helpers.localeParseFloat(
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
		tid = Number.parseInt(tid);
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

	if (tid === PLAYER.TOT) {
		return "TOT";
	}

	if (tid < 0 || Number.isNaN(tid)) {
		// Weird or retired
		return "";
	}

	if (tid >= g.get("teamInfoCache").length) {
		tid = g.get("userTid");
	}

	return g.get("teamInfoCache")[tid]!.abbrev;
};

const leagueUrl = (components: (number | string | undefined)[]): string => {
	return commonHelpers.leagueUrlBase(g.get("lid"), components);
};

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

const pickDesc = async (dp: DraftPick, short?: "short") => {
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
		const abbrev = g.get("teamInfoCache")[dp.originalTid]?.abbrev;
		if (abbrev) {
			extras.push(
				`from <a href="${leagueUrl([
					"roster",
					`${abbrev}_${dp.originalTid}`,
				])}">${abbrev}</a>`,
			);
		}
	}

	// Show record for traded pick, Cause in the trade UI there's no other way to see how good the team is.
	if (
		typeof dp.season === "number" &&
		dp.tid !== dp.originalTid &&
		dp.pick === 0
	) {
		const currentSeason = g.get("season");
		let teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[dp.originalTid, currentSeason],
		);
		const gp = teamSeason ? helpers.getTeamSeasonGp(teamSeason) : 0;
		if (gp === 0) {
			teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[dp.originalTid, currentSeason - 1],
			);
		}
		if (teamSeason && helpers.getTeamSeasonGp(teamSeason) > 0) {
			const record = commonHelpers.formatRecord(teamSeason);
			extras.push(record);
		}
	}

	let desc = `${season} ${commonHelpers.ordinal(dp.round)}`;
	if (extras.length === 0 || !short) {
		desc += " round pick";
	} else if (extras.length === 1) {
		desc += " round";
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

const roundContract = (amount: number) => {
	const minContract = Object.hasOwn(g, "minContract")
		? g.get("minContract")
		: defaultGameAttributes.minContract;

	return roundContractRaw(amount, minContract);
};

// x is value, a controls sharpness, b controls center
const sigmoid = (x: number, a: number, b: number): number => {
	return 1 / (1 + Math.exp(-(a * (x - b))));
};

const effectiveGameLength = () => {
	let gameLength = g.get("numPeriods") * g.get("quarterLength");
	if (isSport("basketball") && g.get("elam") && !g.get("elamOvertime")) {
		gameLength -= g.get("elamMinutes");

		// Assume 2.3 pts per minute
		gameLength += g.get("elamPoints") / 2.3;
	}

	return gameLength;
};

const quarterLengthFactor = () => {
	// sqrt is to account for fatigue in short/long games. Also https://news.ycombinator.com/item?id=11032596
	return Math.sqrt(
		effectiveGameLength() /
			(defaultGameAttributes.numPeriods * defaultGameAttributes.quarterLength),
	);
};

const gameAndSeasonLengthScaleFactor = () => {
	return (
		(quarterLengthFactor() * g.get("numGames")) /
		defaultGameAttributes.numGames[0].value
	);
};

const daysLeft = (freeAgents: boolean, days?: number) => {
	const actualDays = days ?? g.get("daysLeft");

	let dayWeek;
	if (freeAgents) {
		dayWeek = helpers.plural("day", actualDays);
	} else {
		dayWeek = timeBetweenGames(actualDays);
	}
	return `${actualDays} ${dayWeek} left`;
};

const getTeamSeasonGp = (teamSeason: {
	won: number;
	lost: number;
	tied: number;
	otl: number;
}) => {
	return teamSeason.won + teamSeason.lost + teamSeason.tied + teamSeason.otl;
};

// Strips BBCode from strings like:
// [url=https://imgbb.com/][img]https://i.ibb.co/HTGQNH5P/RIO.png[/img][/url]
// [img]https://i.ibb.co/HTGQNH5P/RIO.png[/img]
const stripBbcode = (imgURL: string) => {
	if (!imgURL.trim().startsWith("[")) {
		return imgURL;
	}

	const matches = imgURL.match(/\[img[^\]]*](.*?)\[\/img]/i);
	if (matches?.[1] !== undefined) {
		return matches[1];
	}
	return imgURL;
};

const formatCurrency = (
	amount: number,
	initialUnits?: "M" | "",
	precision?: number,
): string => {
	return commonHelpers.formatCurrencyBase(
		g.get("currencyFormat"),
		amount,
		initialUnits,
		precision,
	);
};

const playoffRoundName = (
	currentRound: number, // Like currentRound from PlayoffSeries, not playoffRoundsWon. Difference is that playoffRoundsWon can be 1 higher than this (for finals winner) and -1 means differnet things (here it is play-in tournament, not missed playoffs)
	numPlayoffRounds: number,
	playoffsByConf: ByConf,
) => {
	if (currentRound === -1) {
		return "play-in tournament";
	}

	if (currentRound === numPlayoffRounds - 1) {
		return "finals" as const;
	}

	// Put this early so as to not glorify just making the playoffs with some fancier text
	if (currentRound === 0) {
		return "1st round" as const;
	}

	const confChampionshipRound =
		playoffsByConf === false
			? undefined
			: numPlayoffRounds - Math.log2(playoffsByConf);

	if (confChampionshipRound !== undefined) {
		if (currentRound === confChampionshipRound - 1) {
			return "conference finals";
		}
		if (currentRound === confChampionshipRound - 2) {
			return "conference semifinals";
		}
	}

	if (currentRound === numPlayoffRounds - 2) {
		return "semifinals";
	}

	if (currentRound === numPlayoffRounds - 3) {
		return "quarterfinals";
	}

	if (currentRound >= 1) {
		return `${commonHelpers.ordinal(currentRound + 1)} round` as const;
	}

	throw new Error(
		`Invalid roundIndex ${currentRound} ${numPlayoffRounds} ${playoffsByConf}`,
	);
};

const roundsWonText = ({
	playoffRoundsWon,
	numPlayoffRounds,
	playoffsByConf,
	showMissedPlayoffs,
}: {
	playoffRoundsWon: number;
	numPlayoffRounds: number;
	playoffsByConf: ByConf;
	showMissedPlayoffs?: boolean;
}) => {
	if (playoffRoundsWon >= 0) {
		if (playoffRoundsWon === numPlayoffRounds) {
			return "league champs";
		}

		const roundName = playoffRoundName(
			playoffRoundsWon,
			numPlayoffRounds,
			playoffsByConf,
		);

		// Put this above "made playoffs" to handle the 2 team playoff case
		if (playoffRoundsWon === numPlayoffRounds - 1) {
			if (playoffsByConf === 2) {
				return "conference champs";
			}

			return `made ${roundName}`;
		}

		if (playoffRoundsWon === 0) {
			// Put this early so as to not glorify just making the playoffs with some fancier text
			return "made playoffs";
		}

		const confChampionshipRound =
			playoffsByConf === false
				? undefined
				: numPlayoffRounds - Math.log2(playoffsByConf);

		if (
			confChampionshipRound !== undefined &&
			playoffRoundsWon === confChampionshipRound
		) {
			return "conference champs";
		}

		return `made ${roundName}`;
	}

	return showMissedPlayoffs ? "missed playoffs" : "";
};

const helpers = {
	...commonHelpers,
	augmentSeries,
	calcWinp,
	correctLinkLid,
	defaultTicketPrice,
	effectiveGameLength,
	formatCurrency,
	gb,
	getAbbrev,
	getTeamSeasonGp,
	leagueUrl,
	numGamesToWinSeries,
	overtimeCounter,
	pickDesc,
	quarterLengthFactor,
	resetG,
	roundContract,
	sigmoid,
	daysLeft,
	gameAndSeasonLengthScaleFactor,
	stripBbcode,
	playoffRoundName,
	roundsWonText,
};

export default helpers;
