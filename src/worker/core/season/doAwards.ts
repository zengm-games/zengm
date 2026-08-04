import type {
	Awards2,
	Conditions,
	GameAttributesLeague,
	Player,
	PlayerFiltered,
} from "../../../common/types.ts";
import { isSport } from "../../../common/sportFunctions.ts";
import { g, helpers } from "../../util/index.ts";
import getLeaderRequirements, {
	getLeaderRequirementsStats,
} from "./getLeaderRequirements.ts";
import { idb } from "../../db/index.ts";
import { POS_NUMBERS_INVERSE } from "../../../common/constants.baseball.ts";
import {
	PHASE,
	PLAYER,
	PLAYER_STATS_TABLES,
} from "../../../common/constants.ts";
import FormulaEvaluator from "../../util/FormulaEvaluator.ts";
import { omit, orderBy } from "../../../common/utils.ts";
import processPlayerStats from "../../../common/processPlayerStats.baseball.ts";
import { defaultGameAttributes } from "../../../common/defaultGameAttributes.ts";

const AWARD_STATS = [
	...(isSport("basketball") ? [] : ["keyStats"]),

	// Anything that appears in a player stats table
	...Object.values(PLAYER_STATS_TABLES).flatMap((x) => x.stats),
];

const getProcessedPlayers = async (
	playersAll: Player[],
	season: number,
	playoffs?: boolean,
) => {
	const stats = Array.from(
		new Set([
			...AWARD_STATS,
			...getLeaderRequirementsStats(getLeaderRequirements(), AWARD_STATS),
		]),
	);

	let players = await idb.getCopies.playersPlus(playersAll, {
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
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats: ["abbrev", "tid", "jerseyNumber", "season", ...stats],
		playoffs,
		regularSeason: !playoffs,
		fuzz: true,
		mergeStats: "totOnly",
	});

	// Only keep players who actually have a stats entry for the latest season
	players = players.filter((p) =>
		p.stats.some((ps: any) => ps.season === season),
	);

	// This can happen if there are 0 games in the regular season - in that case, might as well look for playoff stats too
	if (players.length === 0 && !playoffs) {
		return getProcessedPlayers(playersAll, season, true);
	}

	return players;
};

const getPlayers = async (season: number): Promise<PlayerFiltered[]> => {
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

	const players = await getProcessedPlayers(playersAll, season);

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
			winp: number;
		}
	> = {};
	for (const teamSeason of teamSeasons) {
		teamInfos[teamSeason.tid] = {
			cid: teamSeason.cid,
			did: teamSeason.did,
			gp: helpers.getTeamSeasonGp(teamSeason),
			winp: helpers.calcWinp(teamSeason),
		};
	}

	// For convenience later
	for (const p of players) {
		p.currentStats = p.stats.at(-1);
		for (let i = p.stats.length - 1; i >= 0; i--) {
			if (p.stats[i].season === season) {
				p.currentStats = p.stats[i];
				break;
			}
		}

		p.pos = p.ratings.at(-1).pos;
		if (isSport("baseball")) {
			// Overwrite position with actual position played
			const gpF = (p.currentStats.gpF as (number | undefined)[]).map((gp) =>
				gp === undefined ? 0 : gp,
			);
			let maxGP = 0; // Start at 0 rather than -Infinity because we're not interested in positions with 0 games played
			let maxIndex;
			for (const [i, gp] of gpF.entries()) {
				if (gp > maxGP) {
					maxGP = gp;
					maxIndex = i;
				}
			}

			if (maxIndex !== undefined) {
				p.pos = (POS_NUMBERS_INVERSE as any)[maxIndex + 1];
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;

		// Player somehow on an inactive team needs this fallback, should only happen in a weird custom roster
		p.teamInfo = teamInfos[p.currentStats.tid] ?? {
			cid: undefined,
			did: undefined,
			gp: 0,
			winp: 0,
		};
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
			p.currentStats.fracWS = Math.min(
				// Inner max is to handle negative totalWS
				p.currentStats.ws / Math.max(totalWS[p.currentStats.tid]!, 1),

				// In the rare case that a team has very low or even negative WS, don't let anybody have a crazy high fracWS
				0.8,
			);
		}
	}

	return players;
};

const ROUGH_MPG_NEEDED_FOR_MIP = 20;

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
		if (players.some((p) => p.currentStats.gs > 0)) {
			filteredPlayers = players.filter(
				(p) =>
					p.currentStats.gs === 0 || p.currentStats.gp / p.currentStats.gs > 2,
			);
		}
	}

	if (award.rookie) {
		// Handle case where nobody has GP from a past season, like in a new league - then use draft year
		if (
			players.some((p) =>
				(p.stats as any[]).some(
					(row) => row.season === season - 1 && row.gp > 0,
				),
			)
		) {
			if (isSport("baseball")) {
				const defaultNumGames = defaultGameAttributes.numGames[0].value;

				filteredPlayers = players.filter((p) => {
					const cutoffFactor = p.teamInfo.gp / defaultNumGames;

					let abSum = 0;
					let outsSum = 0;
					for (const row of p.stats) {
						if (row.season < season && !row.playoffs) {
							abSum += processPlayerStats(row, ["ab"]).ab;
							outsSum += row.outs;
						}

						if (abSum >= 130 * cutoffFactor || outsSum >= 150 * cutoffFactor) {
							return false;
						}
					}

					return true;
				});
			} else {
				// This means a player who sits out all regular season but then plays in the playoffs will be ineligible for ROY next year
				filteredPlayers = players.filter((p) =>
					(p.stats as any[]).every(
						(row) => row.season === season || row.gp === 0,
					),
				);
			}
		} else {
			filteredPlayers = players.filter((p) => p.draft.year === season - 1);
		}
	}

	if (award.mip) {
		filteredPlayers = players.filter((p) => {
			// Too many second year players get picked, when it's expected for them to improve (undrafted and second round picks can still win)
			if (p.draft.year + 2 >= p.currentStats.season && p.draft.round === 1) {
				return false;
			}

			// Must have stats last year!
			const oldStatsAll = p.stats.filter(
				(ps: { season: number }) => ps.season === p.currentStats.season - 1,
			);

			const oldStats = oldStatsAll.at(-1);
			if (!oldStats) {
				return false;
			}

			// Sanity check for minutes played
			const mipFactor = getMipFactor(season);
			if (
				p.currentStats.min * p.currentStats.gp <
					ROUGH_MPG_NEEDED_FOR_MIP *
						p.teamInfo.gp *
						helpers.quarterLengthFactor() ||
				oldStats.min * oldStats.gp < 10 * mipFactor
			) {
				return false;
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
	const players = await getPlayers(season);

	const formulaEvaluators: Record<
		string,
		FormulaEvaluator<typeof AWARD_STATS>["evaluate"]
	> = {};

	for (const p of players) {
		p.scores = {};
		for (const award of awards) {
			const formula = award.formula;

			if (p.scores[formula] !== undefined) {
				// If same formula is used for two awards, only calculate once
				continue;
			}

			if (!formulaEvaluators[formula]) {
				const formulaEvaluator = new FormulaEvaluator(
					award.formula,
					AWARD_STATS,
				);
				formulaEvaluators[formula] =
					formulaEvaluator.evaluate.bind(formulaEvaluator);
			}
			const evaluate = formulaEvaluators[formula];

			const currentScore = evaluate(p.currentStats);

			// For MIP, compare score to last season and max of all previous seasons
			if (award.mip) {
				const minCutoff = ROUGH_MPG_NEEDED_FOR_MIP * getMipFactor(season);
				const oldSeasonScores = p.stats
					.filter((ps: { season: number }) => ps.season < p.currentStats.season)
					.filter(
						(ps: { gp: number; min: number }) =>
							ps.min * ps.gp >= minCutoff / 2,
					)
					.map((ps: any) => evaluate(ps));
				const prevScore = oldSeasonScores.at(-1);

				// Include prevSeasonScore because minCutoff could result in that not being included in oldSeasonScores
				const maxScore = Math.max(...oldSeasonScores);

				p.scores[formula] = 2 * currentScore - prevScore - maxScore;
			} else {
				p.scores[formula] = currentScore;
			}
		}
	}

	const realizedAwards: Awards2["awards"] = [];
	for (const baseAward of awards) {
		const baseFilteredPlayers = filterPlayersForAward(
			players,
			baseAward,
			season,
		);

		// Handle conf/div awards - make copies for each one
		let expandedAwards: Omit<Awards2["awards"][number], "winner">[];
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

			if (award.numTeams === undefined) {
				// Individual award
				const winner = orderBy(
					filteredPlayers,
					(p) => p.scores[award.formula],
					"desc",
				)
					.slice(0, numPlayersPerIndividualAward)
					.map((p) => {
						console.log(award.shortName, p.firstName, p.lastName);
						return {
							pid: p.pid as number,
						};
					});
				realizedAwards.push({
					...award,
					numTeams: undefined,
					group,
					winner,
				});
			} else {
				// Team award
			}
		}
	}

	return { players, realizedAwards };
};

const NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD = 5;

const doAwards = async (conditions: Conditions) => {
	const realizedAwards = await processAwards({
		awards: g.get("awards"),
		numPlayersPerIndividualAward: NUM_PLAYERS_TO_STORE_PER_INDIVIDUAL_AWARD,
		season: g.get("season"),
	});
	console.log(realizedAwards);
};

export default doAwards;
