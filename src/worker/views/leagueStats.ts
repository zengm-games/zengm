import { g, helpers } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { averageTeamStats, getStats, ignoreStats } from "./teamStats.ts";
import { PHASE, TEAM_STATS_TABLES } from "../../common/constants.ts";
import { season } from "../core/index.ts";
import { range } from "../../common/utils.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { validateTeam } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"leagueStats">) => {
	const playoffs =
		params.playoffs === "playoffs" ? "playoffs" : "regularSeason";

	const defaultStatType = bySport({
		baseball: "batting",
		basketball: "team",
		football: "summary",
		hockey: "team",
	});

	return {
		team: validateTeam(params.team, ["all"]),
		teamOpponent: params.teamOpponent ?? defaultStatType,
		playoffs,
	};
};

export default defineView({
	id: "leagueStats",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("gameSim") ||
			inputs.team !== prevInputs?.team ||
			inputs.playoffs !== prevInputs?.playoffs ||
			inputs.teamOpponent !== prevInputs?.teamOpponent
		) {
			const statsTable = TEAM_STATS_TABLES[inputs.teamOpponent];

			// TEMP DISABLE WITH ESLINT 9 UPGRADE eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
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
					tid: typeof inputs.team === "number" ? inputs.team : undefined,
					noDynamicAvgAge: true,
				});
				stats = output.stats;
				const output2 = averageTeamStats(output, {
					otl,
					ties,
					tid: typeof inputs.team === "number" ? inputs.team : undefined,
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

			const lengthBefore = stats.length;
			stats = stats.filter((stat) => !ignoreStats.includes(stat));
			const lengthAfter = stats.length;

			// Adjust superCols if ignoreStats removed some
			const superCols = helpers.deepCopy(statsTable.superCols);
			if (superCols?.[0] && lengthBefore !== lengthAfter) {
				const diff = lengthAfter - lengthBefore;
				superCols[0].colspan += diff;
			}

			return {
				playoffs: inputs.playoffs,
				seasons,
				stats,
				superCols,
				team: inputs.team,
				teamOpponent: inputs.teamOpponent,
				ties: season.hasTies(Infinity) || ties,
				otl: g.get("otl") || otl,
				usePts,
			};
		}
	},
});
