import type { TeamSeason, TeamStats } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";
import evaluatePointsFormula from "./evaluatePointsFormula.ts";

// Just the parts of a TeamSeason that matter for standings
export type TeamSeasonRecord = Pick<
	TeamSeason,
	| "tid"
	| "cid"
	| "did"
	| "won"
	| "lost"
	| "otl"
	| "tied"
	| "wonDiv"
	| "lostDiv"
	| "otlDiv"
	| "tiedDiv"
	| "wonConf"
	| "lostConf"
	| "otlConf"
	| "tiedConf"
>;

/**
 * What would a team's record be, if it had some hypothetical results in the games it hasn't played yet?
 *
 * `won` and `lost` are how many of those games it wins and loses. They don't have to be integers.
 *
 * Returns a team object in the format used by functions for figuring out standings and playoff teams, like orderTeams and genPlayoffSeriesFromTeams.
 */
export const getHypotheticalTeam = ({
	teamSeason,
	teamStats,
	won,
	lost,
	usePts,
}: {
	teamSeason: TeamSeasonRecord;
	teamStats?: Pick<TeamStats, "pts" | "oppPts" | "gp">;
	won: number;
	lost: number;
	usePts: boolean;
}) => {
	const seasonAttrs = {
		won: teamSeason.won + won,
		lost: teamSeason.lost + lost,
		otl: teamSeason.otl,
		tied: teamSeason.tied,
		winp: 0,
		pts: 0,
		cid: teamSeason.cid,
		did: teamSeason.did,

		// We don't know who the games are against, so assume they all count for everything
		wonDiv: teamSeason.wonDiv + won,
		lostDiv: teamSeason.lostDiv + lost,
		otlDiv: teamSeason.otlDiv ?? 0,
		tiedDiv: teamSeason.tiedDiv ?? 0,
		wonConf: teamSeason.wonConf + won,
		lostConf: teamSeason.lostConf + lost,
		otlConf: teamSeason.otlConf ?? 0,
		tiedConf: teamSeason.tiedConf ?? 0,
	};

	// Only need the one that is used for standings
	if (usePts) {
		seasonAttrs.pts = evaluatePointsFormula(seasonAttrs);
	} else {
		seasonAttrs.winp = helpers.calcWinp(seasonAttrs);
	}

	return {
		tid: teamSeason.tid,
		seasonAttrs,
		stats: {
			playoffs: false,
			pts: teamStats ? teamStats.pts : 0,
			oppPts: teamStats ? teamStats.oppPts : 0,
			gp: teamStats ? teamStats.gp : 0,
		},
	};
};
