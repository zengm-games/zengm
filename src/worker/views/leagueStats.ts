import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { getStats } from "./teamStats";
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

		const ignoreStats = ["mov", "pw", "pl"];

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
			const seasonAttrs = output.seasonAttrs;
			const teams = output.teams;

			if (!ties || !otl) {
				for (const t of teams) {
					if (t.seasonAttrs.tied > 0) {
						ties = true;
					}
					if (t.seasonAttrs.otl > 0) {
						otl = true;
					}
					if (ties && otl) {
						break;
					}
				}
			}

			const row: {
				season: number;
				numTeams: number;
				stats: Record<string, number>;
			} = {
				season,
				numTeams: teams.length,
				stats: {},
			};

			let foundSomething = false;

			// Average together stats
			for (const stat of [...stats, "gp", "avgAge"]) {
				if (ignoreStats.includes(stat)) {
					continue;
				}
				let sum = 0;
				for (const t of teams) {
					if (inputs.tid >= 0 && t.tid !== inputs.tid) {
						continue;
					}

					if (stat === "avgAge") {
						sum += t.seasonAttrs.avgAge ?? 0;
					} else {
						// @ts-ignore
						sum += t.stats[stat];
					}
					foundSomething = true;
				}

				row.stats[stat] =
					inputs.tid < 0 && teams.length !== 0 ? sum / teams.length : sum;
			}
			for (const attr of seasonAttrs) {
				if (attr === "abbrev") {
					continue;
				}
				let sum = 0;
				for (const t of teams) {
					if (inputs.tid >= 0 && t.tid !== inputs.tid) {
						continue;
					}
					// @ts-ignore
					sum += t.seasonAttrs[attr];
					foundSomething = true;
				}

				// Don't overwrite pts
				const statsKey = attr === "pts" ? "ptsPts" : attr;
				row.stats[statsKey] =
					inputs.tid < 0 && teams.length !== 0 ? sum / teams.length : sum;
			}

			if (foundSomething) {
				seasons.push(row);
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
