import fastDeepEqual from "fast-deep-equal";
import {
	FormulaEvaluator,
	InvalidVariableError,
} from "../../util/FormulaEvaluator.ts";
import {
	chunk,
	groupByUnique,
	omit,
	orderBy,
	range,
} from "../../../common/utils.ts";
import { pruneEmptyWinners, showStatsByType } from "../../../common/awards.ts";
import type {
	Award,
	AwardInfoIndividual,
	AwardInfoTeam,
	AwardPlayer,
	Awards,
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
import { idb } from "../../db/index.ts";
import { TEAM_AWARD_INFO } from "../../../common/constants.ts";
import { hashPlayoffSeries } from "./hashPlayoffSeries.ts";
import { awardCandidateStats } from "./getAwardCandidates.ts";

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
				// Players whose first season in the league was before firstSeasonWithStats - we never can know when their "true" rookie season was
				if (p.draft.year < firstSeasonWithStats - 1) {
					return false;
				}

				const tid = p.currentStats[statRange]?.tid ?? -1;
				const gp = teamInfos[tid]?.gp ?? 0;

				const cutoffFactor = gp / defaultNumGames;

				let abSum = 0;
				let outsSum = 0;
				for (const row of p.stats) {
					if (row.season > seasonForRookieCheck) {
						return false;
					}

					if (row.playoffs === false) {
						abSum += row.ab;
						outsSum += row.outs;

						if (abSum >= 130 * cutoffFactor || outsSum >= 150 * cutoffFactor) {
							// Rookie if this is the season they crossed the threshold
							return row.season === seasonForRookieCheck;
						}
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

// Show extra info if the error is about an invalid variable, when the variable would have been valid outside of a playoff series
const getInvalidVariablesErrorMessageVariablesPart = (
	error: Error,
	playoffSeriesAward: boolean,
) => {
	if (error instanceof InvalidVariableError && playoffSeriesAward) {
		const variables = error.invalidVariables;
		const variablesThatWouldHaveBeenValid = variables.filter((variable) =>
			AWARD_STATS_ALL.includes(variable),
		);
		if (variablesThatWouldHaveBeenValid.length > 0) {
			return `. ${variables.length === 1 ? "This variable is" : "These variables are"} available only for regular season, playoffs, or combined stat ranges, not for playoff seasons${variables.length === variablesThatWouldHaveBeenValid.length ? "" : `: ${variablesThatWouldHaveBeenValid.join(", ")}`}.`;
		}
	}
	return "";
};

// This checks all formulas for all awards, so we know any invalid formulas right away, we know what variables are used in all formulas, and we can easily dedupe
export class FormulaEvaluators {
	errorMessages: string[] | undefined;

	private formulaEvaluators: Record<
		// Need to store normal and playoffSeries separately, otherwise with the same formula it's possible one is valid and the other isn't, and we only know by running `new FormulaEvaluator()`
		"normal" | "playoffSeries",
		Record<string, FormulaEvaluator<string[], string[]>>
	> = {
		normal: {},
		playoffSeries: {},
	};

	variables: {
		normal: Set<string>;
		playoffSeries: Set<string>;
	};

	constructor(awards: GameAttributesLeague["awards"], extraStats: string[]) {
		this.variables = {
			normal: new Set<string>(extraStats),
			playoffSeries: new Set<string>(extraStats),
		};

		if (isSport("baseball")) {
			// Needed for baseball rookie stuff - these might already be picked up elsewhere, but let's be sure
			this.variables.normal.add("ab");
			this.variables.normal.add("outs");

			// Needed for real pos stuff
			this.variables.normal.add("gpF");
		}

		// Needed for bench awards
		this.variables.normal.add("gs");
		this.variables.normal.add("gp");

		for (const award of awards) {
			const type =
				typeof award.statRange === "number" ? "playoffSeries" : "normal";
			this.registerFormula({
				award,
				formula: award.formula,
				opoy: false,
				pos: undefined,
				type,
			});

			if (award.formulaByPos) {
				for (const [pos, formula] of Object.entries(award.formulaByPos)) {
					this.registerFormula({
						award,
						formula,
						opoy: false,
						pos,
						type,
					});
				}
			}

			if (award.numTeams === undefined && award.opoyFormula !== undefined) {
				this.registerFormula({
					award,
					formula: award.opoyFormula,
					opoy: true,
					pos: undefined,
					type,
				});
			}
		}
	}

	private registerFormula({
		award,
		formula,
		opoy,
		pos,
		type,
	}: {
		award: GameAttributesLeague["awards"][number];
		formula: string;
		opoy: boolean;
		pos: string | undefined;
		type: keyof FormulaEvaluators["formulaEvaluators"];
	}) {
		// Add variables from showStats, since we'll need those when assembling player objects. Kind of weird to put this logic here I know, but it's easiest, and that's all that FormulaEvaluator.variables is used for currently! Similar with extraStats. It would be slightly more efficient to pass in the showStats stats like extraStatRanges and extraStats, since they are only needed when award output is displayed, but it's not a big deal.
		// This needs to run before the dupe formula check because you could have two of the same formulas with different showStats!
		for (const stat of [
			...showStatsByType[award.showStats]!,
			...awardCandidateStats[award.showStats]!,
		]) {
			this.variables[type].add(stat);
		}

		if (this.formulaEvaluators[type][formula]) {
			// Two awards have the same formula
			return;
		}

		const playoffSeries = type === "playoffSeries";
		const variables = playoffSeries
			? PLAYOFF_SERIES_AWARD_STATS_ALL
			: AWARD_STATS_ALL;

		const nestedVariables = ["numWon", "numWonConsecutive"];

		let formulaEvaluator;
		try {
			formulaEvaluator = new FormulaEvaluator(
				formula,
				variables,
				nestedVariables,
			);
		} catch (error) {
			const posPart = pos ? `${pos} ` : "";
			const opoyPart = opoy ? `OPOY ` : "";

			this.errorMessages ??= [];
			this.errorMessages.push(
				`${award.shortName} ${posPart}${opoyPart}formula (${formula}): ${error.message}${getInvalidVariablesErrorMessageVariablesPart(error, playoffSeries)}`,
			);

			// At least render something
			formulaEvaluator = new FormulaEvaluator("0", variables, nestedVariables);
		}

		this.formulaEvaluators[type][formula] = formulaEvaluator;

		for (const variable of formulaEvaluator.usedVariables) {
			this.variables[type].add(variable);
		}
	}

	getFormulaEvaluator(
		formula: string,
		{ statRange }: Pick<AwardInfoIndividual, "statRange">,
	) {
		const type = typeof statRange === "number" ? "playoffSeries" : "normal";
		const formulaEvaluator = this.formulaEvaluators[type][formula];
		if (!formulaEvaluator) {
			throw new Error("Formula not registered");
		}

		return formulaEvaluator.evaluate.bind(formulaEvaluator);
	}
}

export const processAwards = async ({
	awards,
	extraStatRanges,
	extraStats,
	numPlayersPerIndividualAward,
	season,
	statOverridesByMatchup,
}: {
	awards: GameAttributesLeague["awards"];
	extraStatRanges: (
		| NonNullable<GameAttributesLeague["awards"][number]["statRange"]>
		| "regularSeason"
	)[];
	extraStats: string[];
	numPlayersPerIndividualAward: number;
	season: number;
	statOverridesByMatchup: StatOverridesByMatchup | undefined;
}) => {
	const formulaEvaluators = new FormulaEvaluators(awards, extraStats);

	const statRanges = new Set([
		...awards.map((award) => award.statRange ?? "regularSeason"),
		...extraStatRanges,
	]);

	const { players, teamInfos } = await getPlayers(
		season,
		statRanges,
		statOverridesByMatchup,
		formulaEvaluators.variables,
	);

	for (const p of players) {
		for (const award of awards) {
			const formula = award.formulaByPos?.[p.pos] ?? award.formula;

			// Used to skip based on award.formula or some hash of stuff that affects score (formula+statRange+mip) but I think it's not worth the complexity and as more features are added it'll just be a source of bugs. So now just assume shortName can be used to uniquely identify a score.

			const evaluate = formulaEvaluators.getFormulaEvaluator(formula, award);
			const currentStats = p.currentStats[award.statRange ?? "regularSeason"];

			if (currentStats) {
				const currentScore = evaluate(currentStats);

				// For MIP, compare score to last season and max of all previous seasons
				if (award.mip) {
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
						.map((ps: any) => {
							// This is needed for numWon and some other things that are on currentStats but not raw stats rows - hacky and kind of incorrect, but probably nobody wants to be doing it anyway, so just don't error at least
							const mergedStats = { ...currentStats, ...ps };

							return evaluate(mergedStats);
						});
					const prevScore = oldSeasonScores.at(-1)!;

					// Include prevSeasonScore because minCutoff could result in that not being included in oldSeasonScores
					const maxScore = Math.max(...oldSeasonScores);

					// Could be slightly more efficient by also reading/storing currentScore from p.scores for MIP, but in practice it'd probably be quite rare for that to matter.
					p.scores[award.shortName] = 2 * currentScore - prevScore - maxScore;
				} else {
					p.scores[award.shortName] = currentScore;
				}
			}

			if (
				p.scores[award.shortName] === undefined ||
				Number.isNaN(p.scores[award.shortName])
			) {
				p.scores[award.shortName] = -Infinity;
			}
		}
	}

	let hasOpoy: boolean = false;

	const realizedAwards: Award[][] = (
		await Promise.all(
			awards.map(async (baseAward) => {
				const baseFilteredPlayers = filterPlayersForAward(
					players,
					baseAward,
					season,
					teamInfos,
				);

				// Handle conf/div/series awards - make copies for each one
				let expandedAwards: DistributiveOmit<
					Awards["awards"][number],
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
					const roundSeries =
						playoffSeries?.series.at(baseAward.statRange) ?? [];
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

						const score = p.scores[award.shortName] ?? -Infinity;
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
									return {};
								}

								let tid = p.currentStats[statRange]?.tid;

								if (group?.type === "playoffSeries") {
									// Save playoff series stats if possible
									const currentStats = p.currentStats[statRange];
									if (currentStats || statOverridesByMatchup) {
										let statOverrides: AwardPlayer["statOverrides"];
										if (currentStats !== undefined) {
											const stats = showStatsByType[award.showStats];
											if (!stats) {
												throw new Error("Invalid showStats");
											}

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
												// No stats, no statOverrides, nothing to do here!
												return {};
											}
											tid = statOverridesAndTid.tid;
											statOverrides = omit(statOverridesAndTid, [
												"tid",
											]) as AwardPlayer["statOverrides"];
										} else {
											// No stats, no statOverrides, nothing to do here!
											return {};
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
							});
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
										// We still want to know what position this slot is for
										return { pos };
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
							const numPlayers = numTeams * TEAM_AWARD_INFO.numPlayersPerTeam;
							const winnerPlayers: AwardInfoTeam["winner"][number] =
								sortedPlayers
									.slice(0, numPlayers)
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
									});

							const winner = chunk(
								winnerPlayers,
								TEAM_AWARD_INFO.numPlayersPerTeam,
							);

							// Placeholder teams if there are no or very few players
							while (winner.length < numTeams) {
								winner.push([]);
							}

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
		)
	).map(pruneEmptyWinners);

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

				if (mvpWinner?.pid !== undefined && opoyWinner?.pid !== undefined) {
					const playersByPid = groupByUnique(players, "pid");
					const mvp = playersByPid[mvpWinner.pid];
					const opoy = playersByPid[opoyWinner.pid];
					if (mvp?.pos === "QB" && opoy) {
						// MVP is a QB - if that QB is a significantly better offensive player (by opoyFormula) than the initial OPOY, then bump them to the top of the list
						const evaluate = formulaEvaluators.getFormulaEvaluator(
							opoyAward.opoyFormula,
							opoyAward,
						);

						const mvpCurrentStats =
							mvp.currentStats[mvpAward.statRange ?? "regularSeason"];
						const mvpScore = mvpCurrentStats
							? evaluate(mvpCurrentStats)
							: undefined;

						const opoyCurrentStats =
							opoy.currentStats[opoyAward.statRange ?? "regularSeason"];
						const opoyScore = opoyCurrentStats
							? evaluate(opoyCurrentStats)
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

	return {
		errorMessages: formulaEvaluators.errorMessages,
		players,
		realizedAwards,
	};
};
