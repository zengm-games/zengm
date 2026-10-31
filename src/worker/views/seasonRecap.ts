import { PHASE } from "../../common/constants.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { orderBy } from "../../common/utils.ts";
import type {
	EventBBGM,
	PlayerStatAttr,
	PlayerStatType,
} from "../../common/types.ts";
import { player, team } from "../core/index.ts";
import { formatAwardNamePrefix } from "../core/awards/prefixes.ts";
import { idb } from "../db/index.ts";
import { PlayersCache } from "../db/PlayersCache.ts";
import { g, local, updatePlayMenu } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";
import getLeaderRequirements, {
	getLeaderRequirementsStats,
} from "../core/season/getLeaderRequirements.ts";
import {
	GamesPlayedCache,
	playerMeetsCategoryRequirements,
} from "./leaders.ts";
import { processEvents } from "./news.ts";

const viewedSeasonSummary = async () => {
	local.unviewedSeasonSummary = false;
	await updatePlayMenu();
};

const getTeamInfo = (
	teamsByTid: Map<
		number,
		{
			abbrev: string;
			lost: number;
			name: string;
			otl?: number;
			region: string;
			tid: number;
			tied?: number;
			won: number;
		}
	>,
	tid: number,
) => {
	const teamInfoCache = g.get("teamInfoCache")[tid];
	const t = teamsByTid.get(tid);

	return {
		abbrev: t?.abbrev ?? teamInfoCache?.abbrev ?? "???",
		lost: t?.lost ?? 0,
		name: t?.name ?? teamInfoCache?.name ?? "???",
		otl: t?.otl,
		region: t?.region ?? teamInfoCache?.region ?? "???",
		tid,
		tied: t?.tied,
		won: t?.won ?? 0,
	};
};

export default defineView({
	id: "seasonRecap",
	processInputs: validateSeasonOnly,
	load: async ({ inputs: { season }, updateEvents, prevInputs }) => {
		if (local.unviewedSeasonSummary) {
			viewedSeasonSummary();
		}

		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("newPhase") ||
			prevInputs?.season !== season
		) {
			const completed =
				season < g.get("season") ||
				(season === g.get("season") && g.get("phase") >= PHASE.DRAFT_LOTTERY);

			if (!completed) {
				return {
					invalidSeason: false as const,
					notCompleted: true as const,
					season,
				};
			}

			const awards = await idb.merged.awards.get(season);

			if (!awards) {
				return {
					invalidSeason: true as const,
					notCompleted: false as const,
					season,
				};
			}

			const teamSeasons = await team.getFormattedAll({
				attrs: ["tid"],
				seasonAttrs: [
					"abbrev",
					"lost",
					"name",
					"otl",
					"playoffRoundsWon",
					"region",
					"tied",
					"won",
				],
				season,
			});

			const teamsByTid = new Map(
				teamSeasons.map((t) => [
					t.tid,
					{
						abbrev: t.seasonAttrs.abbrev,
						lost: t.seasonAttrs.lost,
						name: t.seasonAttrs.name,
						otl: t.seasonAttrs.otl,
						region: t.seasonAttrs.region,
						tid: t.tid,
						tied: t.seasonAttrs.tied,
						won: t.seasonAttrs.won,
					},
				]),
			);

			const numPlayoffRounds = g.get("numGamesPlayoffSeries", season).length;
			const champTeamSeason = teamSeasons.find(
				(t) => t.seasonAttrs.playoffRoundsWon === numPlayoffRounds,
			);
			const champion = champTeamSeason
				? getTeamInfo(teamsByTid, champTeamSeason.tid)
				: undefined;

			const playoffSeries = await idb.merged.playoffSeries.get(season);
			const finalSeries = playoffSeries?.series.at(-1)?.[0];
			let finals:
				| {
						loser: ReturnType<typeof getTeamInfo>;
						loserWins: number;
						winner: ReturnType<typeof getTeamInfo>;
						winnerWins: number;
				  }
				| undefined;
			if (finalSeries?.away) {
				const teams = [finalSeries.home, finalSeries.away];
				const winner =
					(champion ? teams.find((t) => t.tid === champion.tid) : undefined) ??
					orderBy(teams, "won", "desc")[0];
				const loser = teams.find((t) => t.tid !== winner?.tid);
				if (winner && loser) {
					finals = {
						loser: getTeamInfo(teamsByTid, loser.tid),
						loserWins: loser.won,
						winner: getTeamInfo(teamsByTid, winner.tid),
						winnerWins: winner.won,
					};
				}
			}

			const playersCache = new PlayersCache();
			const awardWinners = [];
			for (const award of awards.awards) {
				if (award.numTeams !== undefined) {
					continue;
				}

				const winner = award.winner[0];
				const p =
					winner?.pid === undefined
						? undefined
						: await playersCache.get(winner.pid);
				const name = formatAwardNamePrefix(award, awards.season);
				awardWinners.push({
					key: name,
					name,
					winner:
						winner?.pid !== undefined && p
							? {
									abbrev: getTeamInfo(teamsByTid, winner.tid).abbrev,
									name: `${p.firstName} ${p.lastName}`,
									pid: winner.pid,
									tid: winner.tid,
								}
							: undefined,
				});
			}

			const leaderStats = bySport<PlayerStatAttr[]>({
				baseball: ["hr", "h", "w"],
				basketball: ["pts", "trb", "ast"],
				football: ["pssYds", "rusYds", "recYds"],
				hockey: ["g", "a", "pts"],
			});
			const leaderRequirements = getLeaderRequirements();
			const leaderRequirementStats = getLeaderRequirementsStats(
				leaderRequirements,
				leaderStats,
			);

			const playersRaw = await idb.merged.players.getAll({
				activeSeason: season,
			});
			const leaderPlayers = await player.formatAll(playersRaw, {
				attrs: ["pid", "firstName", "lastName"],
				stats: ["abbrev", "tid", ...leaderStats, ...leaderRequirementStats],
				season,
				showRookies: true,
				mergeStats: "totOnly",
			});
			const statType: PlayerStatType = bySport({
				baseball: "totals",
				basketball: "perGame",
				football: "totals",
				hockey: "totals",
			});
			const gamesPlayedCache = new GamesPlayedCache();
			await gamesPlayedCache.loadSeasons([season], false);

			const leagueLeaders = [];
			for (const stat of leaderStats) {
				const statInfo = {
					stat,
					...leaderRequirements[stat],
				};
				const playersWithStat = leaderPlayers.filter((p) => {
					if (typeof p.stats?.[stat] !== "number") {
						return false;
					}

					return playerMeetsCategoryRequirements({
						career: false,
						cat: statInfo,
						gamesPlayedCache,
						p,
						playerStats: p.stats,
						seasonType: "regularSeason",
						season,
						statType,
					});
				});
				if (playersWithStat.length > 0) {
					const leader = orderBy(
						playersWithStat,
						(p) => p.stats![stat] as number,
						"desc",
					)[0]!;
					const stats = leader.stats!;
					leagueLeaders.push({
						abbrev: stats.abbrev as string,
						firstName: leader.firstName,
						lastName: leader.lastName,
						pid: leader.pid,
						stat,
						tid: stats.tid as number,
						value: stats[stat] as number,
					});
				}
			}

			const players = await player.formatAll(playersRaw, {
				attrs: ["pid", "firstName", "lastName", "age", "watch", "injury"],
				ratings: ["ovr", "pot", "dovr", "dpot", "pos", "skills"],
				stats: ["abbrev", "tid"],
				season,
				fuzz: true,
				showNoStats: true,
				mergeStats: "totOnly",
			});

			const playersWithTeam = players.map((p) => ({
				...p,
				abbrev: p.stats?.abbrev as string,
				tid: p.stats?.tid as number,
			}));
			const playersRising = orderBy(
				playersWithTeam.filter((p) => p.ratings.dovr > 0),
				(p) => p.ratings.dovr,
				"desc",
			).slice(0, 5);
			const playersFalling = orderBy(
				playersWithTeam.filter((p) => p.ratings.dovr < 0),
				(p) => p.ratings.dovr,
				"asc",
			).slice(0, 5);

			const eventsAll = await idb.merged.events.getAll({ season });
			const eventCounts = {
				feats: eventsAll.filter((event) => event.type === "playerFeat").length,
				retirements: eventsAll.filter((event) => event.type === "retired")
					.length,
				trades: eventsAll.filter((event) => event.type === "trade").length,
				tragedies: eventsAll.filter((event) => event.type === "tragedy").length,
			};
			const eventTypes = new Set<EventBBGM["type"]>([
				"playerFeat",
				"retired",
				"trade",
				"tragedy",
			]);
			const notableEventsRaw = orderBy(
				eventsAll.filter((event) => eventTypes.has(event.type)),
				[(event) => event.score ?? 0, "eid"],
				["desc", "desc"],
			).slice(0, 8);
			const notableEvents = await processEvents(notableEventsRaw, {
				level: "all",
			});

			const teams = (
				await team.getFormattedAll({
					seasonAttrs: [
						"abbrev",
						"colors",
						"jersey",
						"imgURL",
						"imgURLSmall",
						"region",
					],
					season,
					addDummySeason: true,
				})
			).map((t) => t.seasonAttrs);

			return {
				awardWinners,
				champion,
				eventCounts,
				finals,
				invalidSeason: false as const,
				leagueLeaders,
				notableEvents,
				notCompleted: false as const,
				playersFalling,
				playersRising,
				season,
				teams,
			};
		}
	},
});
