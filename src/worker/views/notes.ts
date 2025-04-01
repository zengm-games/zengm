import { season, team } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf";
import { processDraftPicks } from "./draftPicks";

const updateNotes = async (
	{ type }: ViewInput<"notes">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("notes") ||
		type !== state.type
	) {
		if (type === "draftPick") {
			const draftPicksRaw = await idb.getCopies.draftPicks(
				{ note: true },
				"noCopyCache",
			);

			const draftPicks = await processDraftPicks(draftPicksRaw);

			return {
				type,
				challengeNoRatings: g.get("challengeNoRatings"),
				draftPicks,
			};
		} else if (type === "game") {
			return {
				type,
			};
		} else if (type === "player") {
			return {
				type,
			};
		} else if (type === "teamSeason") {
			const teamSeasons = await idb.getCopies.teamSeasons(
				{ note: true },
				"noCopyCache",
			);

			const pointsFormula = g.get("pointsFormula");
			const usePts = pointsFormula !== "";

			const playoffsByConfBySeason = new Map<number, boolean>();

			const teams = [];
			for (const ts of teamSeasons) {
				let playoffsByConf = playoffsByConfBySeason.get(ts.season);
				if (playoffsByConf === undefined) {
					playoffsByConf = await getPlayoffsByConf(ts.season);
					playoffsByConfBySeason.set(ts.season, playoffsByConf);
				}

				teams.push({
					tid: ts.tid,
					abbrev: ts.abbrev,
					region: ts.region,
					name: ts.name,
					season: ts.season,
					imgURL: ts.imgURL,
					imgURLSmall: ts.imgURLSmall,
					won: ts.won,
					lost: ts.lost,
					tied: ts.tied,
					otl: ts.otl,
					pts: team.evaluatePointsFormula(ts, {
						season: ts.season,
					}),
					ptsPct: team.ptsPct(ts),
					winp: helpers.calcWinp(ts),
					note: ts.note,
					playoffRoundsWon: ts.playoffRoundsWon,
					numPlayoffRounds: g.get("numGamesPlayoffSeries", ts.season).length,
					playoffsByConf,
				});
			}

			return {
				teams,
				ties: season.hasTies(Infinity),
				type,
				otl: g.get("otl"),
				usePts,
				userTid: g.get("userTid"),
			};
		}
	}
};

export default updateNotes;
