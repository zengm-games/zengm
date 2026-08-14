import type {
	AwardInfoIndividual,
	Awards2,
	Conditions,
	DistributiveOmit,
	GameAttributesLeague,
	NonEmptyArray,
	Player,
} from "../../../common/types.ts";
import { bySport, isSport } from "../../../common/sportFunctions.ts";
import { g, helpers } from "../../util/index.ts";
import getLeaderRequirements, {
	getLeaderRequirementsStats,
} from "./getLeaderRequirements.ts";
import { idb } from "../../db/index.ts";
import {
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
	TEAM_AWARD_INFO,
} from "../../../common/constants.ts";
import FormulaEvaluator from "../../util/FormulaEvaluator.ts";
import {
	chunk,
	groupByUnique,
	last,
	omit,
	orderBy,
	range,
} from "../../../common/utils.ts";
import processPlayerStats from "../../../common/processPlayerStats.baseball.ts";
import { defaultGameAttributes } from "../../../common/defaultGameAttributes.ts";
import {
	leagueLeaders,
	saveAwardsByPlayer,
	teamAwards,
	type AwardsByPlayer,
} from "./awards.ts";
import { getPosByGpF } from "./doAwards.baseball.ts";
import stats from "../player/stats.ts";
import fastDeepEqual from "fast-deep-equal";

const AWARD_STATS = [
	...(isSport("basketball") ? [] : ["keyStats"]),

	// Anything that appears in a player stats table
	...Object.values(PLAYER_STATS_TABLES).flatMap((x) => x.stats),
];

type StatRange =
	| NonNullable<AwardInfoIndividual["statRange"]>
	| "regularSeason";

const getProcessedPlayers = async (
	playersAll: Player[],
	season: number,
	statRanges: Set<StatRange>,
	usePlayoffStatsAsRegularSeason?: boolean,
) => {
	const stats = Array.from(
		new Set([
			...AWARD_STATS,
			...getLeaderRequirementsStats(getLeaderRequirements(), AWARD_STATS),
		]),
	);

	const regularSeason =
		statRanges.has("regularSeason") && !usePlayoffStatsAsRegularSeason;
	const playoffs = statRanges.has("playoffs") || usePlayoffStatsAsRegularSeason;

	let players = (await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"firstName",
			"lastName",
			"tid",
			"abbrev",
			"draft",
			"injury",
			"born",
			"watch",
			"hof",
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats: ["abbrev", "tid", "jerseyNumber", "season", ...stats],
		playoffs,
		regularSeason,
		fuzz: true,
		mergeStats: "totOnly",
	})) as unknown as (Pick<
		Player,
		| "pid"
		| "firstName"
		| "lastName"
		| "tid"
		| "draft"
		| "injury"
		| "born"
		| "watch"
		| "hof"
	> & {
		name: string;
		abbrev: string;
		ratings: NonEmptyArray<{
			pos: string;
			season: number;
			ovr: number;
			dovr: number;
			pot: number;
			skills: string[];
		}>;
		stats: Record<string, any>[];

		// Added later in getPlayers
		pos: string;
		currentStats: Record<string, any>;
		age: number;
		teamInfo: {
			cid: number | undefined;
			did: number | undefined;
			gp: number;
		};
		scores: Record<string, number>;
	})[];

	// Only keep players who actually have a stats entry for the latest season
	players = players.filter((p) => p.stats.some((ps) => ps.season === season));

	// This can happen if there are 0 games in the regular season - in that case, might as well look for playoff stats too
	if (
		statRanges.has("regularSeason") &&
		!usePlayoffStatsAsRegularSeason &&
		players.every(
			(p) => !p.stats.some((ps) => ps.season === season && !ps.playoffs),
		)
	) {
		return getProcessedPlayers(playersAll, season, statRanges, true);
	}

	return players;
};

const getPlayers = async (season: number, statRanges: Set<StatRange>) => {
	let playersAll;
	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		playersAll = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
	}

	const players = await getProcessedPlayers(playersAll, season, statRanges);

	// Add winp, for later
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			season,
		},
		"noCopyCache",
	);
	const teamInfos: Record<
		number,
		{
			cid: number;
			did: number;
			gp: number;
			seasonFraction: number;
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		const gp = helpers.getTeamSeasonGp(teamSeason);
		let seasonFraction;
		if (
			season < g.get("season") ||
			(season === g.get("season") && g.get("phase") >= PHASE.PLAYOFFS)
		) {
			seasonFraction = 1;
		} else {
			seasonFraction = Math.min(1, gp / g.get("numGames"));
		}
		teamInfos[teamSeason.tid] = {
			cid: teamSeason.cid,
			did: teamSeason.did,
			gp,
			seasonFraction,
			winp: helpers.calcWinp(teamSeason),
		};
	}

	for (const p of players) {
		// For convenience later
		p.currentStats =
			p.stats.findLast((row) => row.season === season) ?? p.stats.at(-1)!;
		p.pos = (
			p.ratings.findLast((row) => row.season === season) ?? last(p.ratings)
		).pos;

		if (isSport("baseball")) {
			p.pos = getPosByGpF(p.currentStats.gpF, p.pos);
		}

		// Sum up any byPos stats - not ideal for team awards of awards with formulas by position, but probably good enough since we're using gpF to assign position so most of their games at least will be at the correct position
		if (stats.byPos) {
			const byPosStats = [...stats.byPos];
			if (isSport("baseball")) {
				byPosStats.push("rfld");
			}
			for (const stat of byPosStats) {
				if (Array.isArray(p.currentStats[stat])) {
					p.currentStats[stat] = helpers.sum(p.currentStats[stat]);
				}
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		const teamInfo = teamInfos[p.currentStats.tid];
		p.teamInfo = {
			cid: teamInfo?.cid ?? undefined,
			did: teamInfo?.did ?? undefined,
			gp: teamInfo?.gp ?? 0,
		};

		// Make some teamInfo available in formulas
		p.currentStats.seasonFraction = teamInfo?.seasonFraction ?? 1;
		p.currentStats.teamGp = teamInfo?.gp ?? 0;
		p.currentStats.winp = teamInfo?.winp ?? 0;

		p.scores = {};
	}

	// Add fracWS for basketball current season
	if (isSport("basketball")) {
		const totalWS: Record<number, number> = {};
		for (const p of players) {
			if (totalWS[p.currentStats.tid] === undefined) {
				totalWS[p.currentStats.tid] = 0;
			}
			totalWS[p.currentStats.tid] += p.currentStats.ws;
		}

		for (const p of players) {
			p.currentStats.wsFraction = Math.min(
				// Inner max is to handle negative totalWS
				p.currentStats.ws / Math.max(totalWS[p.currentStats.tid]!, 1),

				// In the rare case that a team has very low or even negative WS, don't let anybody have a crazy high fracWS
				0.8,
			);
		}
	}

	return players;
};

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
	players: Awaited<ReturnType<typeof getPlayers>>,
	award: GameAttributesLeague["awards"][number],
	season: number,
) => {
	let filteredPlayers = players;
	if (award.bench) {
		// Handle case where GS is not available, which happens when loading historical stats
		if (filteredPlayers.some((p) => p.currentStats.gs > 0)) {
			filteredPlayers = filteredPlayers.filter(
				(p) =>
					p.currentStats.gs === 0 || p.currentStats.gp / p.currentStats.gs > 2,
			);
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

			filteredPlayers = filteredPlayers.filter((p) => {
				// `firstSeasonWithStats - 1` because then a player who is a rookie during the first year with stats (p.draft.year === firstSeasonWithStats - 1) will not get caught by this filter
				if (p.draft.year < firstSeasonWithStats - 1) {
					return p.draft.year === seasonForRookieCheck - 1;
				}

				const cutoffFactor = p.teamInfo.gp / defaultNumGames;

				let abSum = 0;
				let outsSum = 0;
				for (const row of p.stats) {
					if (!row.playoffs) {
						abSum += processPlayerStats(row, ["ab"]).ab;
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
				return (p.stats as any[]).every(
					(row) => row.season >= seasonForRookieCheck || row.gp === 0,
				);
			});
		}
	}

	if (award.mip) {
		filteredPlayers = filteredPlayers.filter((p) => {
			// Too many second year players get picked, when it's expected for them to improve (undrafted and second round picks can still win)
			if (p.draft.year + 2 >= p.currentStats.season && p.draft.round === 1) {
				return false;
			}

			// Must have stats last year!
			const oldStatsAll = p.stats.filter(
				(ps) => ps.season === p.currentStats.season - 1,
			);

			const oldStats = oldStatsAll.at(-1);
			if (!oldStats) {
				return false;
			}

			// Sanity check for minutes played
			if (ROUGH_MPG_NEEDED_FOR_MIP !== undefined) {
				const mipFactor = getMipFactor(season);
				if (
					p.currentStats.min * p.currentStats.gp <
						ROUGH_MPG_NEEDED_FOR_MIP *
							p.teamInfo.gp *
							helpers.quarterLengthFactor() ||
					oldStats.min * oldStats.gp <
						0.5 * ROUGH_MPG_NEEDED_FOR_MIP * mipFactor
				) {
					return false;
				}
			} else {
				if (oldStats.gp / p.teamInfo.gp < GP_FRACTION_NEEDED_FOR_MIP) {
					return false;
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
}: {
	awards: GameAttributesLeague["awards"];
	numPlayersPerIndividualAward: number;
	season: number;
}) => {
	const statRanges = new Set(
		awards.map((award) => award.statRange ?? "regularSeason"),
	);

	const players = await getPlayers(season, statRanges);

	const formulaEvaluators: Record<
		string,
		FormulaEvaluator<typeof AWARD_STATS>["evaluate"]
	> = {};

	const formulaStats = [...AWARD_STATS, "seasonFraction", "teamGp", "winp"];
	if (isSport("basketball")) {
		formulaStats.push("wsFraction");
	}

	for (const p of players) {
		for (const award of awards) {
			const formula = award.formulaByPos?.[p.pos] ?? award.formula;

			if (p.scores[formula] !== undefined) {
				// If same formula is used for two awards, only calculate once
				continue;
			}

			if (!formulaEvaluators[formula]) {
				const formulaEvaluator = new FormulaEvaluator(formula, formulaStats);
				formulaEvaluators[formula] =
					formulaEvaluator.evaluate.bind(formulaEvaluator);
			}
			const evaluate = formulaEvaluators[formula];

			const currentScore = evaluate(p.currentStats);

			// For MIP, compare score to last season and max of all previous seasons
			if (award.mip) {
				const minCutoff =
					ROUGH_MPG_NEEDED_FOR_MIP !== undefined
						? ROUGH_MPG_NEEDED_FOR_MIP * getMipFactor(season)
						: ROUGH_MPG_NEEDED_FOR_MIP;
				const oldSeasonScores = p.stats
					.filter((ps) => ps.season < p.currentStats.season)
					.filter((ps) => {
						if (minCutoff === undefined) {
							// Must have palyed in half of team's games last year
							return ps.gp / p.teamInfo.gp >= GP_FRACTION_NEEDED_FOR_MIP;
						}

						return ps.min * ps.gp >= minCutoff / 2;
					})
					.map((ps: any) => evaluate(ps));
				const prevScore = oldSeasonScores.at(-1)!;

				// Include prevSeasonScore because minCutoff could result in that not being included in oldSeasonScores
				const maxScore = Math.max(...oldSeasonScores);

				p.scores[formula] = 2 * currentScore - prevScore - maxScore;
			} else {
				p.scores[formula] = currentScore;
			}
		}
	}

	let hasOpoy: boolean = false;

	const realizedAwards: {
		award: Awards2["awards"][number];
		index: number;
	}[] = [];
	for (const [i, baseAward] of awards.entries()) {
		const baseFilteredPlayers = filterPlayersForAward(
			players,
			baseAward,
			season,
		);

		// Handle conf/div awards - make copies for each one
		let expandedAwards: DistributiveOmit<Awards2["awards"][number], "winner">[];
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
		} else {
			expandedAwards = [omit(baseAward, ["group"])];
		}

		for (const award of expandedAwards) {
			if (award.numTeams === undefined && award.opoyFormula !== undefined) {
				hasOpoy = true;
			}

			let filteredPlayers = baseFilteredPlayers;
			const group = award.group;
			if (group) {
				if (group.type === "div") {
					filteredPlayers = filteredPlayers.filter(
						(p) => p.teamInfo.did === group.did,
					);
				} else {
					filteredPlayers = filteredPlayers.filter(
						(p) => p.teamInfo.cid === group.cid,
					);
				}
			}

			const sortedPlayers = orderBy(
				filteredPlayers,
				(p) => {
					const formula = award.formulaByPos?.[p.pos] ?? award.formula;
					return p.scores[formula] ?? -Infinity;
				},
				"desc",
			);

			const numTeams = award.numTeams;
			if (numTeams === undefined) {
				// Individual award
				const winner = sortedPlayers
					.slice(0, numPlayersPerIndividualAward)
					.map((p) => {
						return {
							pid: p.pid,
						};
					});
				realizedAwards.push({
					award: omit(
						{
							...award,
							group,
							winner,
						},
						["numTeams"],
					),
					index: i,
				});
			} else {
				// Team award
				if (TEAM_AWARD_INFO.byPos) {
					let positions =
						TEAM_AWARD_INFO.positions[award.showStats] ??
						TEAM_AWARD_INFO.positions.default;
					const pidsByPos: Record<string, number[]> = {};

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
								} else {
									const divs = g.get("divs", season);
									const div = divs.find((div) => div.did === group.did);
									dhApplies = !div || dh.includes(div.cid);
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
							pidsByPos[pos] ??= [];
							pidsByPos[pos].push(p.pid);

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
							const pid = pidsByPos[pos]?.shift();
							if (pid === undefined) {
								return;
							}
							return { pid, pos };
						});
					});

					realizedAwards.push({
						award: {
							...award,
							numTeams,
							group,
							winner,
						},
						index: i,
					});
				} else {
					const winner = chunk(
						sortedPlayers
							.slice(0, numTeams * TEAM_AWARD_INFO.numPlayersPerTeam)
							.map((p) => {
								return {
									pid: p.pid,
								};
							}),
						TEAM_AWARD_INFO.numPlayersPerTeam,
					);

					realizedAwards.push({
						award: {
							...award,
							numTeams,
							group,
							winner,
						},
						index: i,
					});
				}
			}
		}
	}

	if (hasOpoy && isSport("football")) {
		for (const { award: opoyAward } of realizedAwards) {
			if (
				opoyAward.numTeams !== undefined ||
				opoyAward.opoyFormula === undefined
			) {
				continue;
			}

			// Need to see if there is an MVP award (not multiple ones, then it's ambiguous what formula to use) that lines up with this award
			const mvpAwards = realizedAwards.filter(
				({ award }) =>
					award.numTeams === undefined &&
					award.mvp &&
					fastDeepEqual(opoyAward.group, award.group),
			);
			if (mvpAwards.length === 1) {
				const mvpAward = mvpAwards[0]!.award as AwardInfoIndividual;
				const mvpWinner = mvpAward.winner[0];
				const opoyWinner = opoyAward.winner[0];
				if (mvpWinner && opoyWinner) {
					const playersByPid = groupByUnique(players, "pid");
					const mvp = playersByPid[mvpWinner.pid];
					const opoy = playersByPid[opoyWinner.pid];
					if (mvp?.pos === "QB" && opoy) {
						// MVP is a QB - if that QB is a significantly better offensive player (by opoyFormula) than the initial OPOY, then bump them to the top of the list
						const formulaEvaluator = new FormulaEvaluator(
							opoyAward.opoyFormula,
							formulaStats,
						);
						const mvpScore = formulaEvaluator.evaluate(mvp.currentStats);
						const opoyScore = formulaEvaluator.evaluate(opoy.currentStats);
						if (mvpScore / opoyScore > 1.2) {
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

	console.log("realizedAwards", realizedAwards);

	return { players, realizedAwards };
};

type ProcessAwardsReturn = Awaited<ReturnType<typeof processAwards>>;

const getAwardsByPlayer = (
	realizedAwards: ProcessAwardsReturn["realizedAwards"],
	players: ProcessAwardsReturn["players"],
	season: number,
) => {
	const playersByPid = groupByUnique(players, "pid");
	const awardsByPlayer: AwardsByPlayer = [];
	for (const { award, index } of realizedAwards) {
		const common = {
			name: award.name,
			shortName: award.shortName,
			index,
		};

		if (award.numTeams === undefined) {
			for (const [i, pTemp] of award.winner.entries()) {
				if (!pTemp) {
					continue;
				}
				const { pid } = pTemp;
				const extra: {
					mvp?: true;
					roy?: true;
				} = {};
				if (award.mvp) {
					extra.mvp = true;
				}
				if (award.roy) {
					extra.roy = true;
				}

				const p = playersByPid[pid]!;
				awardsByPlayer.push({
					pid,
					tid: p.tid,
					name: p.name,
					award: {
						...common,
						...extra,
						rank: i + 1, // Rank in "voting"
					},
				});
			}
		} else {
			for (const [i, team] of award.winner.entries()) {
				for (const pTemp of team) {
					if (!pTemp) {
						continue;
					}
					const { pid } = pTemp;
					const p = playersByPid[pid]!;
					awardsByPlayer.push({
						pid,
						tid: p.tid,
						name: p.name,
						award: {
							...common,
							rank: i + 1, // Team number
							numTeams: award.numTeams,
						},
					});
				}
			}
		}
	}

	return awardsByPlayer;
};

const NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD = 5;

const doAwards = async (conditions: Conditions) => {
	const season = g.get("season");

	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: [
				"won",
				"lost",
				"tied",
				"otl",
				"wonDiv",
				"lostDiv",
				"tiedDiv",
				"otlDiv",
				"wonConf",
				"lostConf",
				"tiedConf",
				"otlConf",
				"winp",
				"pts",
				"playoffRoundsWon",
				"abbrev",
				"region",
				"name",
				"cid",
				"did",
			],
			stats: ["pts", "oppPts", "gp"],
			season,
			showNoStats: true,
		},
		"noCopyCache",
	);
	const bestRecords = await teamAwards(teams);

	const { players, realizedAwards } = await processAwards({
		awards: g.get("awards"),
		numPlayersPerIndividualAward: NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD,
		season,
	});

	const awardsByPlayer = getAwardsByPlayer(realizedAwards, players, season);
	console.log("awardsByPlayer", awardsByPlayer);

	await leagueLeaders(players, awardsByPlayer);

	await saveAwardsByPlayer(awardsByPlayer, conditions, season);

	const awards: Awards2 = {
		season,
		...bestRecords,
		awards: realizedAwards.map((x) => x.award),
	};
	console.log("awards", awards);
	await idb.cache.awards.put(awards);
};

export default doAwards;
