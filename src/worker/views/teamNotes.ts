import { season, team } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateTeamNotes = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("team")) {
		const teamSeasons = await idb.getCopies.teamSeasons(
			{ note: true },
			"noCopyCache",
		);

		const pointsFormula = g.get("pointsFormula");
		const usePts = pointsFormula !== "";

		const teams = teamSeasons.map(ts => {
			return {
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
			};
		});

		return {
			teams,
			ties: season.hasTies(Infinity),
			otl: g.get("otl"),
			usePts,
			userTid: g.get("userTid"),
		};
	}
};

export default updateTeamNotes;
