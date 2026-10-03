import { idb } from "../db/index.ts";
import { g, local, updatePlayMenu } from "../util/index.ts";
import type {
	Award,
	AwardInfoIndividual,
	AwardInfoTeam,
	AwardPlayer,
} from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { processPlayersHallOfFame } from "../util/processPlayersHallOfFame.ts";
import { groupByUnique, last } from "../../common/utils.ts";
import { showStatsByType } from "../../common/awards.ts";
import { getPosByGpF } from "../core/player/getPosByGpF.ts";
import { formatAwardNamePrefix } from "../core/awards/prefixes.ts";
import { PlayersCache } from "../db/PlayersCache.ts";
import { PHASE } from "../../common/constants.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateSeason } from "../util/processInputs.ts";

const processInputs = (params: RouteParams<"history">) => {
	let season = validateSeason(params.season);

	// If playoffs aren't over, season awards haven't been set
	if (g.get("phase") >= 0 && g.get("phase") <= PHASE.PLAYOFFS) {
		// View last season by default
		if (season === g.get("season")) {
			season -= 1;
		}
	}

	return {
		season,
	};
};

const viewedSeasonSummary = async () => {
	local.unviewedSeasonSummary = false;
	await updatePlayMenu();
};

export default defineView({
	id: "history",
	processInputs,
	load: async ({ inputs: { season }, updateEvents, prevInputs }) => {
		if (local.unviewedSeasonSummary) {
			viewedSeasonSummary();
		}

		if (updateEvents.includes("firstRun") || prevInputs?.season !== season) {
			const awards = await idb.getCopy.awards({
				season,
			});

			if (!awards) {
				viewedSeasonSummary(); // Should never happen, but just in case

				// https://stackoverflow.com/a/59923262/786644
				const returnValue = {
					invalidSeason: true as const,
					season,
				};
				return returnValue;
			}

			const teams = await idb.getCopies.teamsPlus(
				{
					attrs: ["tid"],
					seasonAttrs: [
						"playoffRoundsWon",
						"abbrev",
						"region",
						"name",
						"won",
						"lost",
						"tied",
						"otl",
					],
					season,
				},
				"noCopyCache",
			);
			const teamsByTid = groupByUnique(teams, "tid");

			const augmentTeams = (bestRecords: Record<number, number>) => {
				const map = new Map<number, (typeof teamsByTid)[number]>();
				for (const [cidDidString, tid] of Object.entries(bestRecords)) {
					const t = teamsByTid[tid];
					if (t) {
						const cidDid = Number.parseInt(cidDidString);
						map.set(cidDid, t);
					}
				}

				return map;
			};

			const playersCache = new PlayersCache();

			const augmentPlayer = async ({
				pid,
				pos,
				season,
				showStats,
				statOverrides,
				statRange,
				tid,
			}: {
				pid: number;
				pos?: string;
				season: number;
				showStats: AwardInfoIndividual["showStats"];
				statOverrides?: AwardPlayer["statOverrides"];
				statRange: Award["statRange"];
				tid: number;
			}) => {
				const stats = showStatsByType[showStats];
				if (!stats) {
					throw new Error("Invalid showStats");
				}

				const allStats = [...stats];
				if (__SPORT === "baseball") {
					allStats.push("gpF");
				}

				const p = await playersCache.get(pid);
				if (!p) {
					return;
				}
				const p2 = await idb.getCopy.playersPlus(p, {
					attrs: ["name"],
					stats: allStats,
					season,
					seasonType:
						statRange === undefined
							? "regularSeason"
							: statRange === "combined"
								? "combined"
								: "playoffs",
					mergeStats: "totOnly",
					showNoStats: true,
					fuzz: true,
				});
				if (!p2) {
					return;
				}

				// Manually add pos, since ratings could have been deleted or something
				const ratingsPos =
					p.ratings.findLast((row) => row.season === season)?.pos ??
					last(p.ratings).pos;

				// Could have asked for "abbrev" in playersPlus, but we already have the teams in memory...
				const t = teamsByTid[tid];

				return {
					pid,
					name: p2.name as string,
					pos: pos ?? getPosByGpF(p2.stats.gpF, ratingsPos),
					statOverrides,
					stats: {
						...p2.stats,
						tid,
						abbrev: t?.seasonAttrs.abbrev ?? "???",
					},
				};
			};

			const individualAwards: (Omit<AwardInfoIndividual, "winner"> & {
				winner: Awaited<ReturnType<typeof augmentPlayer>>;
			})[] = [];
			const individualAwardsPlayoffs: typeof individualAwards = [];
			const teamAwards: (Omit<AwardInfoTeam, "winner"> & {
				winner: (
					| Awaited<ReturnType<typeof augmentPlayer>>
					| { pos?: string }
				)[][];
			})[] = [];

			for (const award of awards.awards) {
				const numTeams = award.numTeams;
				if (numTeams === undefined) {
					const winner =
						award.winner[0]?.pid === undefined
							? undefined
							: await augmentPlayer({
									...award.winner[0],
									season: awards.season,
									showStats: award.showStats,
									statRange: award.statRange,
								});

					const augmented = {
						...award,
						numTeams,
						name: formatAwardNamePrefix(award, awards.season),
						winner,
					};

					if (
						award.statRange === "playoffs" ||
						typeof award.statRange === "number"
					) {
						individualAwardsPlayoffs.push(augmented);
					} else {
						individualAwards.push(augmented);
					}
				} else {
					const winner: (typeof teamAwards)[number]["winner"] = [];
					for (const team of award.winner) {
						const augmentedTeam: (typeof winner)[number] = [];
						for (const pTemp of team) {
							const p =
								pTemp.pid === undefined
									? pTemp
									: await augmentPlayer({
											...pTemp,
											season: awards.season,
											showStats: award.showStats,
											statRange: award.statRange,
										});
							augmentedTeam.push(p);
						}
						winner.push(augmentedTeam);
					}

					const augmented = {
						...award,
						numTeams,
						name: formatAwardNamePrefix(award, awards.season),
						winner,
					};

					teamAwards.push(augmented);
				}
			}

			const awardsAugmented = {
				season: awards.season,
				bestRecordConfs: augmentTeams(awards.bestRecordConfs),
				individualAwards,
				individualAwardsPlayoffs,
				teamAwards,
			};

			const retiredPlayersAll = await idb.getCopies.players(
				{
					retiredYear: season,
				},
				"noCopyCache",
			);
			const retiredStat = bySport({
				baseball: "war",
				basketball: "ws",
				football: "av",
				hockey: "ps",
			} as const);
			const retiredPlayers = processPlayersHallOfFame(
				await idb.getCopies.playersPlus(retiredPlayersAll, {
					attrs: ["pid", "name", "born", "hof"],
					ratings: ["pos", "season"],
					stats: ["season", "tid", "abbrev", retiredStat],
					showNoStats: true,
				}),
			).map((p) => {
				const lastStats = p.stats.at(-1);

				return {
					pid: p.pid,
					name: p.name,
					age: season - p.born.year,
					hof: p.hof,
					pos: p.bestPos,
					t:
						lastStats?.season === season
							? {
									tid: lastStats.tid,
									abbrev: lastStats.abbrev,
								}
							: undefined,
					stat: p.careerStats[retiredStat],
				};
			});
			retiredPlayers.sort((a, b) => (b.stat ?? 0) - (a.stat ?? 0));

			// Get champs
			const champ = teams.find(
				(t) =>
					t.seasonAttrs.playoffRoundsWon ===
					g.get("numGamesPlayoffSeries", season).length,
			);

			return {
				awards: awardsAugmented,
				champ,
				confs: g.get("confs", season),
				invalidSeason: false as const,
				retiredPlayers,
				retiredStat,
				season,
			};
		}
	},
});
