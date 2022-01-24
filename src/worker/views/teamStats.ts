import { idb } from "../db";
import { g, helpers } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	TeamStatAttr,
	TeamSeasonAttr,
} from "../../common/types";
import { TEAM_STATS_TABLES, bySport } from "../../common";
import { team } from "../core";

export const getStats = async ({
	season,
	playoffs,
	statsTable,
	usePts,
	tid,
	noDynamicAvgAge,
}: {
	season: number;
	playoffs: boolean;
	statsTable: {
		stats: string[];
	};
	usePts: boolean;
	tid?: number;
	noDynamicAvgAge?: boolean;
}) => {
	const stats = statsTable.stats;
	const seasonAttrs: TeamSeasonAttr[] = [
		"abbrev",
		"won",
		"lost",
		"tied",
		"otl",
		"avgAge",
	];
	if (usePts) {
		seasonAttrs.push("pts", "ptsPct");
	} else {
		seasonAttrs.push("winp");
	}
	const teams = (
		await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs,
				stats: ["gp", ...stats] as TeamStatAttr[],
				season,
				tid,
				playoffs,
				regularSeason: !playoffs,
			},
			"noCopyCache",
		)
	).filter(t => {
		// For playoffs, only show teams who actually made playoffs (gp > 0)
		return !playoffs || t.stats.gp > 0;
	});

	// For playoffs, fix W/L to be playoff W/L not regular season
	if (playoffs) {
		const playoffSeries = await idb.getCopy.playoffSeries(
			{
				season,
			},
			"noCopyCache",
		);

		if (playoffSeries !== undefined) {
			// Reset W/L
			for (const t of teams) {
				t.seasonAttrs.won = 0;
				t.seasonAttrs.lost = 0;
				t.seasonAttrs.tied = 0;
				t.seasonAttrs.otl = 0;
			}

			for (const round of playoffSeries.series) {
				for (const series of round) {
					for (const ah of ["away", "home"] as const) {
						const ha = ah === "away" ? "home" : "away";
						const t = teams.find(
							// https://github.com/microsoft/TypeScript/issues/21732
							// @ts-expect-error
							t2 => series[ah] && t2.tid === series[ah].tid,
						);

						if (t && series[ah] && series[ha]) {
							// https://github.com/microsoft/TypeScript/issues/21732
							// @ts-expect-error
							t.seasonAttrs.won += series[ah].won;
							// @ts-expect-error
							t.seasonAttrs.lost += series[ha].won;
						}
					}
				}
			}
		}

		for (const t of teams) {
			if (usePts) {
				t.seasonAttrs.pts = team.evaluatePointsFormula(t.seasonAttrs, {
					season,
				});
				t.seasonAttrs.ptsPct = team.ptsPct(t.seasonAttrs);
			} else {
				t.seasonAttrs.winp = helpers.calcWinp(t.seasonAttrs);
			}
		}
	}

	for (const t of teams) {
		if (t.seasonAttrs.avgAge === undefined) {
			let playersRaw;
			if (g.get("season") === season) {
				playersRaw = await idb.cache.players.indexGetAll("playersByTid", t.tid);
			} else {
				if (noDynamicAvgAge) {
					continue;
				}
				playersRaw = await idb.getCopies.players(
					{
						statsTid: t.tid,
					},
					"noCopyCache",
				);
			}

			const players = await idb.getCopies.playersPlus(playersRaw, {
				attrs: ["age"],
				stats: ["gp", "min"],
				season,
				showNoStats: g.get("season") === season,
				showRookies: g.get("season") === season,
				tid: t.tid,
			});

			t.seasonAttrs.avgAge = team.avgAge(players);
		}
	}

	return {
		seasonAttrs,
		stats,
		teams,
	};
};

export const ignoreStats = ["mov", "pw", "pl"];

export const averageTeamStats = (
	{ seasonAttrs, stats, teams }: Awaited<ReturnType<typeof getStats>>,
	{ otl, ties, tid }: { otl: boolean; ties: boolean; tid?: number | undefined },
) => {
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

	const row: Record<string, number> = {};

	let foundSomething = false;

	// Average together stats
	for (const stat of [...stats, "gp", "avgAge"]) {
		if (ignoreStats.includes(stat)) {
			continue;
		}
		let sum = 0;
		for (const t of teams) {
			if (tid !== undefined && t.tid !== tid) {
				continue;
			}

			if (stat === "avgAge") {
				sum += t.seasonAttrs.avgAge ?? 0;
			} else {
				// @ts-expect-error
				sum += t.stats[stat];
			}
			foundSomething = true;
		}

		row[stat] =
			tid === undefined && teams.length !== 0 ? sum / teams.length : sum;
	}
	for (const attr of seasonAttrs) {
		if (attr === "abbrev") {
			continue;
		}
		let sum = 0;
		for (const t of teams) {
			if (tid !== undefined && t.tid !== tid) {
				continue;
			}
			// @ts-expect-error
			sum += t.seasonAttrs[attr];
			foundSomething = true;
		}

		// Don't overwrite pts
		const statsKey = attr === "pts" ? "ptsPts" : attr;
		row[statsKey] =
			tid === undefined && teams.length !== 0 ? sum / teams.length : sum;
	}

	return {
		row: foundSomething ? row : undefined,
		otl,
		ties,
	};
};

const updateTeams = async (
	inputs: ViewInput<"teamStats">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.playoffs !== state.playoffs ||
		inputs.season !== state.season ||
		inputs.teamOpponent !== state.teamOpponent
	) {
		const statsTable = TEAM_STATS_TABLES[inputs.teamOpponent];

		if (!statsTable) {
			throw new Error(`Invalid statType: "${inputs.teamOpponent}"`);
		}

		const pointsFormula = g.get("pointsFormula", inputs.season);
		const usePts = pointsFormula !== "";

		const { seasonAttrs, stats, teams } = await getStats({
			season: inputs.season,
			playoffs: inputs.playoffs === "playoffs",
			statsTable,
			usePts,
		});

		let ties = g.get("ties", inputs.season);
		let otl = g.get("otl", inputs.season);
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

		// Sort stats so we can determine what percentile our team is in.
		const allStats: Record<string, number[]> = {};
		let statTypes: string[] = seasonAttrs.slice();

		for (const table of Object.values(TEAM_STATS_TABLES)) {
			statTypes = statTypes.concat(table.stats);
		}
		statTypes = Array.from(new Set(statTypes));

		const lowerIsBetter = bySport({
			basketball: [
				"lost",
				"otl",
				"tov",
				"pf",
				"oppFg",
				"oppFga",
				"oppFgp",
				"oppTp",
				"oppTpa",
				"oppTpp",
				"opp2p",
				"opp2pa",
				"opp2pp",
				"oppFt",
				"oppFta",
				"oppFtp",
				"oppOrb",
				"oppDrb",
				"oppTrb",
				"oppAst",
				"oppStl",
				"oppBlk",
				"oppPts",
				"oppMov",
				"pl",
				"drtg",
				"tovp",
				"oppFgAtRim",
				"oppFgaAtRim",
				"oppFgpAtRim",
				"oppFgLowPost",
				"oppFgaLowPost",
				"oppFgpLowPost",
				"oppFgMidRange",
				"oppFgaMidRange",
				"oppFgpMidRange",
			],
			football: [
				"lost",
				"otl",
				"tov",
				"fmbLost",
				"pssInt",
				"pen",
				"penYds",
				"drivesTurnoverPct",
				"oppPts",
				"oppYds",
				"oppPly",
				"oppYdsPerPlay",
				"oppPssCmp",
				"oppPss",
				"oppPssYds",
				"oppPssTD",
				"oppPssNetYdsPerAtt",
				"oppRus",
				"oppRusYds",
				"oppRusTD",
				"oppRusYdsPerAtt",
				"oppDrives",
				"oppDrivesScoringPct",
				"oppAvgFieldPosition",
				"oppTimePerDrive",
				"oppPlaysPerDrive",
				"oppYdsPerDrive",
				"oppPtsPerDrive",
			],
			hockey: [
				"lost",
				"otl",
				"pim",
				"fol",
				"gv",
				"gaa",
				"oppG",
				"oppA",
				"oppEvG",
				"oppPpG",
				"oppShG",
				"oppEvA",
				"oppPpA",
				"oppShA",
				"oppS",
				"oppSPct",
				"oppTsa",
				"oppPpo",
				"oppPpPct",
				"oppFow",
				"oppFoPct",
				"oppBlk",
				"oppHit",
				"oppTk",
				"oppSv",
				"oppSvPct",
				"oppSo",
				"oppMov",
			],
		});

		for (const t of teams) {
			for (const statType of statTypes) {
				const value = t.stats.hasOwnProperty(statType)
					? (t.stats as any)[statType]
					: (t.seasonAttrs as any)[statType];

				if (value === undefined) {
					continue;
				}

				// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
				if (!allStats[statType]) {
					allStats[statType] = [value];
				} else {
					allStats[statType].push(value);
				}
			}
		}

		// Sort stat types. "Better" values are at the start of the arrays.
		for (const statType of helpers.keys(allStats)) {
			allStats[statType].sort((a, b) => {
				// Sort lowest first.
				if (lowerIsBetter.includes(statType)) {
					if (a < b) {
						return -1;
					}

					if (a > b) {
						return 1;
					}

					return 0;
				}

				// Sort highest first.
				if (a < b) {
					return 1;
				}

				if (a > b) {
					return -1;
				}

				return 0;
			});
		}

		const { row: averages } = averageTeamStats(
			{ seasonAttrs, stats, teams },
			{
				otl,
				ties,
			},
		);

		return {
			allStats,
			averages,
			playoffs: inputs.playoffs,
			season: inputs.season,
			stats,
			superCols: statsTable.superCols,
			teamOpponent: inputs.teamOpponent,
			teams,
			ties,
			otl,
			usePts,
			userTid: g.get("userTid"),
		};
	}
};

export default updateTeams;
