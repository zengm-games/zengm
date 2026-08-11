import { idb } from "../db/index.ts";
import { g, local, updatePlayMenu } from "../util/index.ts";
import type {
	AwardInfoIndividual,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import { bySport, isSport } from "../../common/sportFunctions.ts";
import { processPlayersHallOfFame } from "../util/processPlayersHallOfFame.ts";
import { groupByUnique } from "../../common/utils.ts";
import { showStatsByType } from "../../common/awards.ts";
import { getPosByGpF } from "../core/season/doAwards.baseball.ts";

const viewedSeasonSummary = async () => {
	local.unviewedSeasonSummary = false;
	await updatePlayMenu();
};

const updateHistory = async (
	{ season }: ViewInput<"history">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (local.unviewedSeasonSummary) {
		viewedSeasonSummary();
	}

	if (updateEvents.includes("firstRun") || state.season !== season) {
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

		const augmentPlayer = async ({
			pid,
			season,
			showStats,
			statRange,
		}: {
			pid: number;
			season: number;
			showStats: AwardInfoIndividual["showStats"];
			statRange: "combined" | "playoffs" | "regularSeason";
		}) => {
			const stats = showStatsByType[showStats];
			if (!stats) {
				throw new Error("Invalid showStats");
			}

			const allStats = [...stats, "tid"];
			if (isSport("baseball")) {
				allStats.push("gpF");
			}

			const p = await idb.getCopy.players({ pid }, "noCopyCache");
			if (!p) {
				return;
			}
			const p2 = await idb.getCopy.playersPlus(p, {
				attrs: ["name"],
				ratings: ["pos"],
				stats: allStats,
				season,
				playoffs: statRange === "playoffs",
				regularSeason: statRange === "regularSeason",
				combined: statRange === "combined",
				mergeStats: "totOnly",
				showNoStats: true,
				fuzz: true,
			});
			if (!p2) {
				return;
			}

			// Could have asked for "abbrev" in playersPlus, but we already have the teams in memory...
			const t = teamsByTid[p2.stats.tid];
			if (!t) {
				return;
			}

			return {
				pid: p.pid,
				name: p2.name as string,
				pos: getPosByGpF(p2.stats.gpF, p.pos),
				stats: {
					...p2.stats,
					abbrev: t.seasonAttrs.abbrev,
				},
				tid: p.tid,
			};
		};

		const individualAwards: (Omit<AwardInfoIndividual, "winner"> & {
			winner: NonNullable<Awaited<ReturnType<typeof augmentPlayer>>>;
		})[] = [];
		const individualAwardsPlayoffs: typeof individualAwards = [];
		const teamAwards = [];

		for (const award of awards.awards) {
			if (typeof award.statRange === "number") {
				continue;
			}

			if (award.numTeams === undefined) {
				const pid = award.winner[0]?.pid;
				if (pid === undefined) {
					continue;
				}
				const winner = await augmentPlayer({
					pid,
					season: awards.season,
					showStats: award.showStats,
					statRange: award.statRange ?? "regularSeason",
				});
				if (!winner) {
					continue;
				}

				if (award.statRange === "playoffs") {
					individualAwardsPlayoffs.push({
						...award,
						winner,
					});
				} else {
					individualAwards.push({
						...award,
						winner,
					});
				}
			}
		}

		const awardsAugmented = {
			season: awards.season,
			bestRecord: teamsByTid[awards.bestRecord],
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
		});
		const retiredPlayers = processPlayersHallOfFame(
			await idb.getCopies.playersPlus(retiredPlayersAll, {
				attrs: ["pid", "name", "age", "hof"],
				ratings: ["pos", "season"],
				stats: ["season", "tid", "abbrev", retiredStat],
				showNoStats: true,
			}),
		).map((p) => {
			const lastStats = p.stats.at(-1);

			return {
				pid: p.pid,
				name: p.name,
				age: p.age,
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
		retiredPlayers.sort((a, b) => b.stat - a.stat);

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
};

export default updateHistory;
