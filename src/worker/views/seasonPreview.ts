import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { team } from "../core/index.ts";
import { groupBy, orderBy } from "../../common/utils.ts";
import { PHASE } from "../../common/index.ts";
import { loadAbbrevs } from "./gameLog.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";

const updateSeasonPreview = async (
	{ season }: ViewInput<"seasonPreview">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (updateEvents.includes("firstRun") || state.season !== season) {
		const NUM_PLAYERS_TO_SHOW = 10;
		const NUM_TEAMS_TO_SHOW = 5;

		const playersRaw = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);

		const prevTeamTidsByPid = new Map<number, number>();

		for (const p of playersRaw) {
			const prevTid = p.stats.findLast((row) => row.season === season - 1)?.tid;
			if (prevTid === undefined) {
				continue;
			}

			let currentTid;
			if (
				g.get("season") === season &&
				(g.get("phase") === PHASE.PRESEASON ||
					!p.stats.some((row) => row.season === season))
			) {
				currentTid = p.tid;
			} else {
				currentTid = p.stats.find((row) => row.season === season)?.tid;
			}

			if (currentTid === undefined || currentTid < 0) {
				continue;
			}

			if (currentTid !== prevTid) {
				prevTeamTidsByPid.set(p.pid, prevTid);
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
				"value",
				"draft",
				"injury",
			],
			ratings: ["ovr", "pot", "dovr", "dpot", "pos", "skills", "ovrs"],
			season,
			fuzz: true,
			showNoStats: true,
		});

		const playersTopAll = orderBy(players, (p) => p.ratings.ovr, "desc");

		const playersTop = playersTopAll.slice(0, NUM_PLAYERS_TO_SHOW);
		const playersImproving = orderBy(
			players.filter((p) => p.ratings.dovr > 0),
			(p) => p.ratings.ovr + 2 * p.ratings.dovr,
			"desc",
		).slice(0, NUM_PLAYERS_TO_SHOW);
		const playersDeclining = orderBy(
			players.filter((p) => p.ratings.dovr < 0),
			(p) => p.ratings.ovr - 3 * p.ratings.dovr,
			"desc",
		).slice(0, NUM_PLAYERS_TO_SHOW);
		const playersTopRookies = orderBy(
			players.filter((p) => p.draft.year === season - 1),
			(p) => p.ratings.ovr,
			"desc",
		).slice(0, NUM_PLAYERS_TO_SHOW);

		const playersNewTeam = [];
		if (prevTeamTidsByPid.size > 0) {
			const prevAbbrevs = await loadAbbrevs(season - 1);
			for (const p of playersTopAll) {
				const prevTid = prevTeamTidsByPid.get(p.pid);
				if (prevTid !== undefined) {
					playersNewTeam.push({
						...p,
						prevTid,
						prevAbbrev: prevAbbrevs[prevTid] ?? helpers.getAbbrev(prevTid),
					});
					if (playersNewTeam.length === NUM_PLAYERS_TO_SHOW) {
						break;
					}
				}
			}
		}

		const teamSeasonsCurrent = await idb.getCopies.teamSeasons(
			{
				season,
			},
			"noCopyCache",
		);
		const teamSeasonsPrev = await idb.getCopies.teamSeasons(
			{
				season: season - 1,
			},
			"noCopyCache",
		);

		const playersByTid = groupBy(players, "tid");

		// These are used when displaying last year's playoff results, so they are for last season
		const numPlayoffRounds = g.get("numGamesPlayoffSeries", season - 1).length;
		const playoffsByConf = await getPlayoffsByConf(season - 1);

		const teamSeasons = teamSeasonsCurrent.map((teamSeason) => {
			const teamPlayers = playersByTid[teamSeason.tid] ?? [];

			let ovrStart = teamSeason.ovrStart;
			if (ovrStart === undefined) {
				// Hasn't played first game yet, or old season where ovrStart didn't exist
				ovrStart = team.ovr(teamPlayers);
			}

			const teamSeasonPrev = teamSeasonsPrev.find(
				(ts) => ts.tid === teamSeason.tid,
			);
			const ovrPrev = teamSeasonPrev?.ovrEnd ?? ovrStart;
			const dovr = ovrStart - ovrPrev;

			const teamInfoCache = g.get("teamInfoCache")[teamSeason.tid]!;

			const lastSeason = teamSeasonPrev
				? {
						won: teamSeasonPrev.won,
						lost: teamSeasonPrev.lost,
						tied: teamSeasonPrev.tied,
						otl: teamSeasonPrev.otl,
						roundsWonText: helpers.roundsWonText({
							playoffRoundsWon: teamSeasonPrev.playoffRoundsWon,
							numPlayoffRounds,
							playoffsByConf,
						}),
					}
				: undefined;

			return {
				tid: teamSeason.tid,
				abbrev: teamSeason.abbrev ?? teamInfoCache.abbrev,
				region: teamSeason.region ?? teamInfoCache.region,
				name: teamSeason.name ?? teamInfoCache.name,
				ovr: ovrStart,
				dovr,
				players: orderBy(teamPlayers, (p) => p.ratings.ovr, "desc").slice(0, 2),
				lastSeason,
			};
		});

		const teamsTop = orderBy(teamSeasons, "ovr", "desc").slice(
			0,
			NUM_TEAMS_TO_SHOW,
		);
		const teamsImproving = orderBy(
			teamSeasons.filter((t) => t.dovr > 0),
			"dovr",
			"desc",
		).slice(0, NUM_TEAMS_TO_SHOW);
		const teamsDeclining = orderBy(
			teamSeasons.filter((t) => t.dovr < 0),
			"dovr",
			"asc",
		).slice(0, NUM_TEAMS_TO_SHOW);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			playersDeclining,
			playersImproving,
			playersNewTeam,
			playersTop,
			playersTopRookies,
			season,
			teamsDeclining,
			teamsImproving,
			teamsTop,
			userTid: g.get("userTid"),
		};
	}
};

export default updateSeasonPreview;
