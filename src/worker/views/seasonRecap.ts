import { AWARD_NAMES, PHASE, SIMPLE_AWARDS } from "../../common/constants.ts";
import { bySport } from "../../common/sportFunctions.ts";
import { orderBy } from "../../common/utils.ts";
import type { EventBBGM, UpdateEvents, ViewInput } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import { g, local, updatePlayMenu } from "../util/index.ts";
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

const addAbbrev = (
	obj:
		| {
				abbrev?: string;
				tid: number;
		  }
		| undefined,
	teamsByTid: Parameters<typeof getTeamInfo>[0],
) => {
	if (obj === undefined) {
		return;
	}

	obj.abbrev = getTeamInfo(teamsByTid, obj.tid).abbrev;
};

const updateSeasonRecap = async (
	{ season }: ViewInput<"seasonRecap">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (local.unviewedSeasonSummary) {
		viewedSeasonSummary();
	}

	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		state.season !== season
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

		const awards = await idb.getCopy.awards({
			season,
		});

		if (!awards) {
			return {
				invalidSeason: true as const,
				notCompleted: false as const,
				season,
			};
		}

		const teamSeasons = await idb.getCopies.teamsPlus(
			{
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
			},
			"noCopyCache",
		);

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

		for (const key of SIMPLE_AWARDS) {
			addAbbrev(awards[key], teamsByTid);
		}

		const numPlayoffRounds = g.get("numGamesPlayoffSeries", season).length;
		const champTeamSeason = teamSeasons.find(
			(t) => t.seasonAttrs.playoffRoundsWon === numPlayoffRounds,
		);
		const champion = champTeamSeason
			? getTeamInfo(teamsByTid, champTeamSeason.tid)
			: undefined;

		const playoffSeries = await idb.getCopy.playoffSeries({
			season,
		});
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

		const awardWinners = SIMPLE_AWARDS.map((key) => ({
			key,
			name: AWARD_NAMES[key] ?? key,
			winner: awards[key],
		}));

		const leaderStats = bySport({
			baseball: ["hr", "h", "w"],
			basketball: ["pts", "trb", "ast"],
			football: ["pssYds", "rusYds", "recYds"],
			hockey: ["g", "a", "pts"],
		});

		const playersRaw = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
		const leaderPlayers = await idb.getCopies.playersPlus(playersRaw, {
			attrs: ["pid", "firstName", "lastName", "abbrev", "tid"],
			stats: leaderStats,
			season,
			showRookies: true,
			mergeStats: "totOnly",
		});

		const leagueLeaders = [];
		for (const stat of leaderStats) {
			const playersWithStat = leaderPlayers.filter(
				(p) => typeof p.stats[stat] === "number",
			);
			if (playersWithStat.length > 0) {
				const leader = orderBy(
					playersWithStat,
					(p) => p.stats[stat],
					"desc",
				)[0]!;
				leagueLeaders.push({
					abbrev: leader.abbrev,
					firstName: leader.firstName,
					lastName: leader.lastName,
					pid: leader.pid,
					stat,
					tid: leader.tid,
					value: leader.stats[stat],
				});
			}
		}

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: [
				"pid",
				"tid",
				"abbrev",
				"firstName",
				"lastName",
				"age",
				"watch",
				"injury",
			],
			ratings: ["ovr", "pot", "dovr", "dpot", "pos", "skills"],
			season,
			fuzz: true,
			showNoStats: true,
		});

		const playersRising = orderBy(
			players.filter((p) => p.ratings.dovr > 0),
			(p) => p.ratings.dovr,
			"desc",
		).slice(0, 5);
		const playersFalling = orderBy(
			players.filter((p) => p.ratings.dovr < 0),
			(p) => p.ratings.dovr,
			"asc",
		).slice(0, 5);

		const eventsAll = await idb.getCopies.events({
			season,
		});
		const eventCounts = {
			feats: eventsAll.filter((event) => event.type === "playerFeat").length,
			retirements: eventsAll.filter((event) => event.type === "retired").length,
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
			await idb.getCopies.teamsPlus(
				{
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
				},
				"noCopyCache",
			)
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
};

export default updateSeasonRecap;
