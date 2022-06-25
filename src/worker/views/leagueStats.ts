import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { averageTeamStats, getStats, ignoreStats } from "./teamStats";
import range from "lodash-es/range";
import { PHASE, TEAM_STATS_TABLES } from "../../common";

const updateLeagueStats = async (
	inputs: ViewInput<"leagueStats">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("gameSim") ||
		inputs.tid !== state.tid ||
		inputs.playoffs !== state.playoffs ||
		inputs.teamOpponent !== state.teamOpponent
	) {
		const statsTable = TEAM_STATS_TABLES[inputs.teamOpponent];

		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!statsTable) {
			throw new Error(`Invalid statType: "${inputs.teamOpponent}"`);
		}

		let ties = false;
		let otl = false;

		let stats: string[] = [];

		let maxSeason = g.get("season");
		if (
			inputs.playoffs === "playoffs" &&
			g.get("phase") >= 0 &&
			g.get("phase") < PHASE.PLAYOFFS
		) {
			maxSeason -= 1;
		}
		if (
			inputs.playoffs !== "playoffs" &&
			g.get("phase") >= 0 &&
			g.get("phase") < PHASE.REGULAR_SEASON
		) {
			maxSeason -= 1;
		}

		const pointsFormula = g.get("pointsFormula");
		const usePts = pointsFormula !== "";

		const seasons = [];
		for (const season of range(g.get("startingSeason"), maxSeason + 1)) {
			// Get all team stats for this season
			// Would be nice to do all seasons in one call....
			const output = await getStats({
				season,
				playoffs: inputs.playoffs === "playoffs",
				statsTable,
				usePts,
				tid: inputs.tid >= 0 ? inputs.tid : undefined,
				noDynamicAvgAge: true,
			});
			stats = output.stats;
			const output2 = averageTeamStats(output, {
				otl,
				ties,
				tid: inputs.tid >= 0 ? inputs.tid : undefined,
			});
			otl = output2.otl;
			ties = output2.ties;

			if (output2.row) {
				seasons.push({
					season,
					numTeams: output.teams.length,
					stats: output2.row,
				});
			}
		}

		stats = stats.filter(stat => !ignoreStats.includes(stat));

		return {
			abbrev: inputs.abbrev,
			playoffs: inputs.playoffs,
			seasons,
			stats,
			superCols: statsTable.superCols,
			teamOpponent: inputs.teamOpponent,
			tid: inputs.tid,
			ties: g.get("ties") || ties,
			otl: g.get("otl") || otl,
			usePts,
		};
	}
};

export default updateLeagueStats;
