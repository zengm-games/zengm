import fastDeepEqual from "fast-deep-equal";
import FormulaEvaluator from "../../util/FormulaEvaluator.ts";
import {
	chunk,
	groupByUnique,
	omit,
	orderBy,
	range,
} from "../../../common/utils.ts";
import { showStatsByType } from "../../../common/awards.ts";
import type {
	Award2,
	AwardInfoIndividual,
	AwardPlayer2,
	Awards2,
	DistributiveOmit,
	GameAttributesLeague,
} from "../../../common/types.ts";
import {
	AWARD_STATS_ALL,
	PLAYOFF_SERIES_AWARD_STATS_ALL,
	type StatOverridesByMatchup,
	getPlayers,
} from "./getPlayers.ts";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import helpers from "../../util/helpers.ts";
import { defaultGameAttributes } from "../../../common/defaultGameAttributes.ts";
import g from "../../util/g.ts";
import { processStats as processStatsBaseball } from "../../../common/processPlayerStats.baseball.ts";
import { idb } from "../../db/index.ts";
import { TEAM_AWARD_INFO } from "../../../common/constants.ts";
import { hashPlayoffSeries } from "./hashPlayoffSeries.ts";

const ROUGH_MPG_NEEDED_FOR_MIP = bySport({
	baseball: undefined,
	basketball: 20,
	football: undefined,
	hockey: 10,
});
const GP_FRACTION_NEEDED_FOR_MIP = 0.5; // Only used if ROUGH_MPG_NEEDED_FOR_MIP is undefined

const getMipFactor = (season: number) =>
	g.get("numGames", season) * helpers.quarterLengthFactor();

const filterPlayersForAward = (
	players: Awaited<ReturnType<typeof getPlayers>>["players"],
	award: GameAttributesLeague["awards"][number],
	season: number,
	teamInfos: Record<number, { gp: number }>,
) => {
	let filteredPlayers = players;
	if (award.bench) {
		// Handle case where GS is not available, which happens when loading historical stats
		if (
			filteredPlayers.some((p) => {
				const currentStats = p.currentStats[award.statRange ?? "regularSeason"];
				return currentStats && currentStats.gs > 0;
			})
		) {
			filteredPlayers = filteredPlayers.filter((p) => {
				const currentStats = p.currentStats[award.statRange ?? "regularSeason"];
				return (
					currentStats &&
					(currentStats.gs === 0 || currentStats.gp / currentStats.gs > 2)
				);
			});
		}
	}

	if (award.rookie) {
		// Handle case where nobody has GP from a past season, like in a new league or with deleted data - then use draft year
		let firstSeasonWithStats = Infinity;
		for (const p of players) {
			const row = p.stats[0];
			if (row && row.gp > 0 && row.season < firstSeasonWithStats) {
				firstSeasonWithStats = row.season;
			}
		}

		const seasonForRookieCheck =
			g.get("repeatSeason")?.startingSeason ?? season;

		if (isSport("baseball")) {
			const defaultNumGames = defaultGameAttributes.numGames[0].value;
			const statRange = award.statRange ?? "regularSeason";

			filteredPlayers = filteredPlayers.filter((p) => {
				// `firstSeasonWithStats - 1` because then a player who is a rookie during the first year with stats (p.draft.year === firstSeasonWithStats - 1) will not get caught by this filter
				if (p.draft.year < firstSeasonWithStats - 1) {
					return p.draft.year === seasonForRookieCheck - 1;
				}

				const tid = p.currentStats[statRange]?.tid ?? -1;
				const gp = teamInfos[tid]?.gp ?? 0;

				const cutoffFactor = gp / defaultNumGames;

				let abSum = 0;
				let outsSum = 0;
				for (const row of p.stats) {
					if (row.playoffs === false) {
						abSum += processStatsBaseball(row, ["ab"]).ab;
						outsSum += row.outs;
					}

					if (abSum >= 130 * cutoffFactor || outsSum >= 150 * cutoffFactor) {
						// Rookie if this is the season they crossed the threshold
						return row.season === seasonForRookieCheck;
					}
				}

				// Haven't crossed threshold yet
				return false;
			});
		} else {
			filteredPlayers = filteredPlayers.filter((p) => {
				if (p.draft.year < firstSeasonWithStats) {
					return p.draft.year === seasonForRookieCheck - 1;
				}

				// This means a player who sits out all regular season but then plays in the playoffs will be ineligible for ROY next year
				return p.stats.every(
					(row) => row.season >= seasonForRookieCheck || row.gp === 0,
				);
			});
		}
	}

	if (award.mip) {
		const statRange = award.statRange ?? "regularSeason";

		filteredPlayers = filteredPlayers.filter((p) => {
			// Too many second year players get picked, when it's expected for them to improve (undrafted and second round picks can still win)
			if (p.draft.year + 2 >= season && p.draft.round === 1) {
				return false;
			}

			// Must have stats last year!
			const oldStatsAll = p.stats.filter((ps) => {
				if (ps.season !== season - 1) {
					return false;
				}

				if (statRange === "regularSeason" && ps.playoffs !== false) {
					return false;
				}
				if (statRange === "playoffs" && ps.playoffs !== true) {
					return false;
				}
				if (statRange === "combined" && ps.playoffs !== "combined") {
					return false;
				}

				return true;
			});

			const oldStats = oldStatsAll.at(-1);
			if (!oldStats) {
				return false;
			}

			// Sanity check for minutes played - skip for playoffs or playoff series because it's always small
			if (statRange === "regularSeason" || statRange === "combined") {
				const tid = p.currentStats[statRange]?.tid ?? -1;
				const gp = teamInfos[tid]?.gp ?? 0;

				if (ROUGH_MPG_NEEDED_FOR_MIP !== undefined) {
					const mipFactor = getMipFactor(season);
					if (
						(p.currentStats[statRange] &&
							p.currentStats[statRange].min * p.currentStats[statRange].gp <
								ROUGH_MPG_NEEDED_FOR_MIP *
									gp *
									helpers.quarterLengthFactor()) ||
						oldStats.min * oldStats.gp <
							0.5 * ROUGH_MPG_NEEDED_FOR_MIP * mipFactor
					) {
						return false;
					}
				} else {
					if (oldStats.gp / gp < GP_FRACTION_NEEDED_FOR_MIP) {
						return false;
					}
				}
			}

			return true;
		});
	}

	return filteredPlayers;
};

export const processAwards = async ({
	awards,
	numPlayersPerIndividualAward,
	season,
	statOverridesByMatchup,
}: {
	awards: GameAttributesLeague["awards"];
	numPlayersPerIndividualAward: number;
	season: number;
	statOverridesByMatchup: StatOverridesByMatchup | undefined;
}) => {
	const statRanges = new Set(
		awards.map((award) => award.statRange ?? "regularSeason"),
	);

	const { players, teamInfos } = await getPlayers(
		season,
		statRanges,
		statOverridesByMatchup,
	);

	const formulaEvaluators: Record<
		string,
		FormulaEvaluator<string[]>["evaluate"]
	> = {};

	let errorMessages: string[] | undefined;

	for (const p of players) {
		for (const award of awards) {
			const formula = award.formulaByPos?.[p.pos] ?? award.formula;

			const statRange = award.statRange ?? "regularSeason";
			p.scores[statRange] ??= {};
			const scores = p.scores[statRange];

			if (scores[formula] !== undefined) {
				// If same formula is used for two awards, only calculate once
				continue;
			}

			if (!formulaEvaluators[formula]) {
				const symbols =
					typeof statRange === "number"
						? PLAYOFF_SERIES_AWARD_STATS_ALL
						: AWARD_STATS_ALL;

				let formulaEvaluator;
				try {
					formulaEvaluator = new FormulaEvaluator(formula, symbols);
				} catch (error) {
					const posPart = award.formulaByPos?.[p.pos] ? `${p.pos} ` : "";

					errorMessages ??= [];
					errorMessages.push(
						`${award.shortName} ${posPart}formula (${award.formula}): ${error.message}`,
					);

					// At least render something
					formulaEvaluator = new FormulaEvaluator("0", symbols);
				}

				formulaEvaluators[formula] =
					formulaEvaluator.evaluate.bind(formulaEvaluator);
			}
			const evaluate = formulaEvaluators[formula];

			const currentStats = p.currentStats[award.statRange ?? "regularSeason"];
			const currentScore =
				currentStats && evaluate ? evaluate(currentStats) : -Infinity;

			// For MIP, compare score to last season and max of all previous seasons
			if (award.mip && evaluate) {
				const statRange = award.statRange ?? "regularSeason";
				if (typeof statRange === "number") {
					throw new Error("mip not supported for playoff series award");
				}

				// Use minCutoff only for regularSeason or combined, otherwise there's just going to be very few stats regardless
				const careAboutMinCutoff =
					statRange === "regularSeason" || statRange === "combined";
				const minCutoff =
					ROUGH_MPG_NEEDED_FOR_MIP !== undefined && careAboutMinCutoff
						? ROUGH_MPG_NEEDED_FOR_MIP * getMipFactor(season)
						: undefined;
				const oldSeasonScores = p.stats
					.filter((ps) => {
						if (ps.season >= season) {
							return false;
						}

						if (statRange === "regularSeason" && ps.playoffs !== false) {
							return false;
						}
						if (statRange === "playoffs" && ps.playoffs !== true) {
							return false;
						}
						if (statRange === "combined" && ps.playoffs !== "combined") {
							return false;
						}

						if (minCutoff === undefined) {
							if (careAboutMinCutoff) {
								const tid = p.currentStats[statRange]?.tid ?? -1;
								const gp = teamInfos[tid]?.gp ?? 0;

								// Must have played in half of team's games last year
								return ps.gp / gp >= GP_FRACTION_NEEDED_FOR_MIP;
							} else {
								return true;
							}
						}

						return ps.min * ps.gp >= minCutoff / 2;
					})
					.map((ps: any) => evaluate(ps));
				const prevScore = oldSeasonScores.at(-1)!;

				// Include prevSeasonScore because minCutoff could result in that not being included in oldSeasonScores
				const maxScore = Math.max(...oldSeasonScores);

				scores[formula] = 2 * currentScore - prevScore - maxScore;
			} else {
				scores[formula] = currentScore;
			}

			if (Number.isNaN(scores[formula])) {
				scores[formula] = -Infinity;
			}
		}
	}

	let hasOpoy: boolean = false;

	const realizedAwards: Award2[][] = await Promise.all(
		awards.map(async (baseAward) => {
			const baseFilteredPlayers = filterPlayersForAward(
				players,
				baseAward,
				season,
				teamInfos,
			);

			// Handle conf/div/series awards - make copies for each one
			let expandedAwards: DistributiveOmit<
				Awards2["awards"][number],
				"winner"
			>[];
			if (baseAward.group === "conf") {
				const confs = g.get("confs", season);
				expandedAwards = confs.map((conf) => {
					return {
						...baseAward,
						group: {
							type: "conf",
							cid: conf.cid,
						},
					};
				});
			} else if (baseAward.group === "div") {
				const divs = g.get("divs", season);
				expandedAwards = divs.map((div) => {
					return {
						...baseAward,
						group: {
							type: "div",
							did: div.did,
						},
					};
				});
			} else if (typeof baseAward.statRange === "number") {
				const playoffSeries = await idb.getCopy.playoffSeries(
					{ season },
					"noCopyCache",
				);
				const roundSeries = playoffSeries?.series.at(baseAward.statRange) ?? [];
				expandedAwards = roundSeries
					.map((series, i) => {
						if (!series.away) {
							return;
						}

						return {
							...baseAward,
							group: {
								type: "playoffSeries",
								tids: [series.home.tid, series.away.tid],
							} as const,
						};
					})
					.filter((award) => award !== undefined);

				// Show placeholder award if no series
				if (expandedAwards.length === 0) {
					expandedAwards = [
						{
							...baseAward,
							group: {
								type: "playoffSeries",
								tids: [-1, -1],
							},
						},
					];
				}
			} else {
				expandedAwards = [omit(baseAward, ["group"])];
			}

			return expandedAwards.map((award) => {
				if (award.numTeams === undefined && award.opoyFormula !== undefined) {
					hasOpoy = true;
				}

				const statRange = award.statRange ?? "regularSeason";

				let filteredPlayers = baseFilteredPlayers;
				const group = award.group;
				if (group) {
					if (group.type === "div") {
						filteredPlayers = filteredPlayers.filter((p) => {
							const currentStats = p.currentStats[statRange];
							if (!currentStats) {
								return false;
							}
							const tid = currentStats.tid;
							return teamInfos[tid]?.did === group.did;
						});
					} else if (group.type === "conf") {
						filteredPlayers = filteredPlayers.filter((p) => {
							const currentStats = p.currentStats[statRange];
							if (!currentStats) {
								return false;
							}
							const tid = currentStats.tid;
							return teamInfos[tid]?.cid === group.cid;
						});
					} else {
						filteredPlayers = filteredPlayers.filter((p) => {
							if (statOverridesByMatchup) {
								const matchupKey = hashPlayoffSeries(group);
								const statOverrides =
									statOverridesByMatchup[matchupKey]?.[p.pid];
								if (statOverrides) {
									return group.tids.includes(statOverrides.tid);
								}
							}

							// This is a playoff series, so look for playoff series tid, in case player was somehow traded/moved to the playoff team and didn't record a regular season stat with them
							const currentStats = p.currentStats[statRange];
							return currentStats && group.tids.includes(currentStats.tid);
						});
					}
				}

				const getScore = (p: (typeof players)[number]) => {
					// Use statOverridesByMatchup score if it exists, for old Award Races
					if (statOverridesByMatchup && group?.type == "playoffSeries") {
						const matchupKey = hashPlayoffSeries(group);
						const statOverrides = statOverridesByMatchup[matchupKey]?.[p.pid];
						if (statOverrides) {
							return statOverrides.score;
						}
					}

					const formula = award.formulaByPos?.[p.pos] ?? award.formula;
					const score = p.scores[statRange]?.[formula] ?? -Infinity;
					if (Number.isNaN(score)) {
						return -Infinity;
					}
					return score;
				};

				const sortedPlayers = orderBy(filteredPlayers, getScore, "desc");

				const numTeams = award.numTeams;
				if (numTeams === undefined) {
					// Individual award
					const winner = sortedPlayers
						.slice(0, numPlayersPerIndividualAward)
						.map((p) => {
							const score = getScore(p);
							if (score === -Infinity) {
								return;
							}

							let tid = p.currentStats[statRange]?.tid;

							if (group?.type === "playoffSeries") {
								// Save playoff series stats if possible
								const currentStats = p.currentStats[statRange];
								if (currentStats || statOverridesByMatchup) {
									const stats = showStatsByType[award.showStats];
									if (!stats) {
										throw new Error("Invalid showStats");
									}

									let statOverrides: AwardPlayer2["statOverrides"];
									if (currentStats !== undefined) {
										tid = currentStats.tid;
										statOverrides = {
											score,
										};
										for (const stat of stats) {
											if (currentStats[stat] !== undefined) {
												statOverrides[stat] = currentStats[stat];
											}
										}
									} else if (statOverridesByMatchup) {
										// Find statOverrides values from original awards, if possible. Otherwise we won't have any stats to display on Award Races for playoff series awards if box scores are deleted
										const matchupKey = hashPlayoffSeries(group);
										const statOverridesAndTid =
											statOverridesByMatchup[matchupKey]?.[p.pid];
										if (!statOverridesAndTid) {
											// No stats, no statOverrides, no thing to do here!
											return;
										}
										tid = statOverridesAndTid.tid;
										statOverrides = omit(statOverridesAndTid, [
											"tid",
										]) as AwardPlayer2["statOverrides"];
									} else {
										// No stats, no statOverrides, no thing to do here!
										return;
									}

									return {
										pid: p.pid,
										tid,
										statOverrides,
									};
								}
							}

							if (tid === undefined) {
								throw new Error("Should never happen");
							}

							return {
								pid: p.pid,
								tid,
							};
						})
						.filter((row) => row !== undefined);
					return omit(
						{
							...award,
							group,
							winner,
						},
						["numTeams"],
					);
				} else {
					// Team award
					if (TEAM_AWARD_INFO.byPos) {
						let positions =
							TEAM_AWARD_INFO.positions[award.showStats] ??
							TEAM_AWARD_INFO.positions.default;
						const playersByPos: Record<string, typeof players> = {};

						// In baseball, have to do special stuff to handle if the DH setting is enabled or not
						if (isSport("baseball")) {
							const dhOrPIndex = positions.indexOf("DH_OR_P");
							const dhIfExistsIndex = positions.indexOf("DH_IF_EXISTS");

							if (dhOrPIndex >= 0 || dhIfExistsIndex >= 0) {
								positions = [...positions];

								// See if DH setting is enabled - this works for current season but not any past ones, so I guess it is okay for team awards since those are never recomputed
								const dh = g.get("dh");

								// Question is, do we have DH applying to at least some teams covered by this team award?
								let dhApplies: boolean;
								if (dh === "all") {
									dhApplies = true;
								} else if (dh === "none") {
									dhApplies = false;
								} else {
									// DH applies to some conferences
									if (!group) {
										dhApplies = true;
									} else if (group.type === "conf") {
										dhApplies = dh.includes(group.cid);
									} else if (group.type === "div") {
										const divs = g.get("divs", season);
										const div = divs.find((div) => div.did === group.did);
										dhApplies = !div || dh.includes(div.cid);
									} else {
										// Not strictly correct for a playoff series, but too lazy to look up values for individual teams, since realistically who is making an all-league team from a playoff series? Come on.
										dhApplies = true;
									}
								}

								if (dhApplies) {
									if (dhOrPIndex >= 0) {
										positions[dhOrPIndex] = "DH";
									}
									if (dhIfExistsIndex >= 0) {
										positions[dhIfExistsIndex] = "DH";
									}
								} else {
									if (dhOrPIndex >= 0) {
										positions[dhOrPIndex] = "P";
									}
									if (dhIfExistsIndex >= 0) {
										positions.splice(dhIfExistsIndex, 1);
									}
								}
							}
						}

						// Add up how many players we need at each position, factoring in that a position could be listed multiple times per team
						const positionsNeeded = new Map<string, number>();
						for (const pos of positions) {
							const count = positionsNeeded.get(pos) ?? 0;
							positionsNeeded.set(pos, count + numTeams);
						}

						for (const p of sortedPlayers) {
							const score = getScore(p);
							if (score === -Infinity) {
								continue;
							}

							const pos = bySport({
								baseball: () => {
									if (p.pos === "SP" || p.pos === "RP") {
										return "P";
									}
									return p.pos;
								},
								basketball: () => p.pos,
								football: () => p.pos,
								hockey: () => p.pos,
							})();

							const needed = positionsNeeded.get(pos);
							if (needed !== undefined && needed > 0) {
								playersByPos[pos] ??= [];
								playersByPos[pos].push(p);

								if (needed === 1) {
									positionsNeeded.delete(pos);
								} else {
									positionsNeeded.set(pos, needed - 1);
								}
							}

							if (positionsNeeded.size === 0) {
								break;
							}
						}

						const winner = range(numTeams).map((i) => {
							return positions.map((pos) => {
								const p = playersByPos[pos]?.shift();
								if (p === undefined) {
									return;
								}
								const tid = p.currentStats[statRange]?.tid;
								if (tid === undefined) {
									throw new Error("Should never happen");
								}
								return { pid: p.pid, pos, tid };
							});
						});

						return {
							...award,
							numTeams,
							group,
							winner,
						};
					} else {
						const winner = chunk(
							sortedPlayers
								.slice(0, numTeams * TEAM_AWARD_INFO.numPlayersPerTeam)
								.filter((p) => p.currentStats[statRange])
								.map((p) => {
									const tid = p.currentStats[statRange]?.tid;
									if (tid === undefined) {
										throw new Error("Should never happen");
									}

									return {
										pid: p.pid,
										tid,
									};
								}),
							TEAM_AWARD_INFO.numPlayersPerTeam,
						);

						return {
							...award,
							numTeams,
							group,
							winner,
						};
					}
				}
			});
		}),
	);

	if (hasOpoy && isSport("football")) {
		const flatRealizedAwards = realizedAwards.flat();
		for (const opoyAward of flatRealizedAwards) {
			if (
				opoyAward.numTeams !== undefined ||
				opoyAward.opoyFormula === undefined
			) {
				continue;
			}

			// Need to see if there is an MVP award (not multiple ones, then it's ambiguous what formula to use) that lines up with this award
			const mvpAwards = flatRealizedAwards.filter(
				(award) =>
					award.numTeams === undefined &&
					award.actAs === "mvp" &&
					fastDeepEqual(opoyAward.group, award.group),
			);
			if (mvpAwards.length === 1) {
				const mvpAward = mvpAwards[0]! as AwardInfoIndividual;
				const mvpWinner = mvpAward.winner[0];
				const opoyWinner = opoyAward.winner[0];

				const mvpPlayoffSeries = typeof mvpAward.statRange === "number";
				const opoyPlayoffSeries = typeof opoyAward.statRange === "number";

				// Both must have winner and either both or neither must be a playoff series (for common stats in formula)
				if (mvpWinner && opoyWinner && mvpPlayoffSeries === opoyPlayoffSeries) {
					const playersByPid = groupByUnique(players, "pid");
					const mvp = playersByPid[mvpWinner.pid];
					const opoy = playersByPid[opoyWinner.pid];
					if (mvp?.pos === "QB" && opoy) {
						// MVP is a QB - if that QB is a significantly better offensive player (by opoyFormula) than the initial OPOY, then bump them to the top of the list
						let formulaEvaluator;
						try {
							formulaEvaluator = new FormulaEvaluator(
								opoyAward.opoyFormula,
								opoyPlayoffSeries
									? PLAYOFF_SERIES_AWARD_STATS_ALL
									: AWARD_STATS_ALL,
							);
						} catch (error) {
							errorMessages ??= [];
							errorMessages.push(
								`${opoyAward.shortName} OPOY formula (${opoyAward.formula}): ${error.message}`,
							);
						}

						if (formulaEvaluator) {
							const mvpCurrentStats =
								mvp.currentStats[mvpAward.statRange ?? "regularSeason"];
							const mvpScore = mvpCurrentStats
								? formulaEvaluator.evaluate(mvpCurrentStats)
								: undefined;

							const opoyCurrentStats =
								opoy.currentStats[opoyAward.statRange ?? "regularSeason"];
							const opoyScore = opoyCurrentStats
								? formulaEvaluator.evaluate(opoyCurrentStats)
								: undefined;

							if (
								mvpScore !== undefined &&
								opoyScore !== undefined &&
								mvpScore / opoyScore > 1.2
							) {
								opoyAward.winner = [
									{ ...mvpWinner, opoyOverride: true as const },
									...opoyAward.winner,
								].slice(0, numPlayersPerIndividualAward);
							}
						}
					}
				}
			}
		}
	}

	return { errorMessages, players, realizedAwards };
};
