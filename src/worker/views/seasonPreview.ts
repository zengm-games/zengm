import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import orderBy from "lodash-es/orderBy";
import { team } from "../core";
import { groupBy } from "../../common/groupBy";

const updateSeasonPreview = async (
	{ season }: ViewInput<"seasonPreview">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("watchList") ||
		state.season !== season
	) {
		const NUM_PLAYERS_TO_SHOW = 10;
		const NUM_TEAMS_TO_SHOW = 5;

		const playersRaw = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: [
				"pid",
				"tid",
				"abbrev",
				"name",
				"age",
				"watch",
				"face",
				"imgURL",
				"hgt",
				"weight",
				"value",
			],
			ratings: ["ovr", "pot", "dovr", "dpot", "pos", "skills", "ovrs"],
			season,
			fuzz: true,
			showNoStats: true,
		});

		const playersTop = orderBy(players, p => p.ratings.ovr, "desc").slice(
			0,
			NUM_PLAYERS_TO_SHOW,
		);
		const playersImproving = orderBy(
			players.filter(p => p.ratings.dovr > 0),
			p => p.ratings.ovr + 2 * p.ratings.dovr,
			"desc",
		).slice(0, NUM_PLAYERS_TO_SHOW);
		const playersDeclining = orderBy(
			players.filter(p => p.ratings.dovr < 0),
			p => p.ratings.ovr - 3 * p.ratings.dovr,
			"desc",
		).slice(0, NUM_PLAYERS_TO_SHOW);

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

		const teamSeasons = teamSeasonsCurrent.map(teamSeason => {
			const teamPlayers = playersByTid[teamSeason.tid] ?? [];

			let ovrStart = teamSeason.ovrStart;
			if (ovrStart === undefined) {
				// Hasn't played first game yet, or old season where ovrStart didn't exist
				ovrStart = team.ovr(teamPlayers);
			}

			const teamSeasonPrev = teamSeasonsPrev.find(
				ts => ts.tid === teamSeason.tid,
			);
			const ovrPrev = teamSeasonPrev?.ovrEnd ?? ovrStart;
			const dovr = ovrStart - ovrPrev;

			const teamInfoCache = g.get("teamInfoCache")[teamSeason.tid];

			const lastSeason = teamSeasonPrev
				? {
						won: teamSeasonPrev.won,
						lost: teamSeasonPrev.lost,
						tied: teamSeasonPrev.tied,
						otl: teamSeasonPrev.otl,
						playoffRoundsWon: teamSeasonPrev.playoffRoundsWon,
				  }
				: undefined;

			return {
				tid: teamSeason.tid,
				abbrev: teamSeason.abbrev ?? teamInfoCache.abbrev,
				region: teamSeason.region ?? teamInfoCache.region,
				name: teamSeason.name ?? teamInfoCache.name,
				ovr: ovrStart,
				dovr,
				players: orderBy(teamPlayers, p => p.ratings.ovr, "desc").slice(0, 2),
				lastSeason,
			};
		});

		const teamsTop = orderBy(teamSeasons, "ovr", "desc").slice(
			0,
			NUM_TEAMS_TO_SHOW,
		);
		const teamsImproving = orderBy(
			teamSeasons.filter(t => t.dovr > 0),
			"dovr",
			"desc",
		).slice(0, NUM_TEAMS_TO_SHOW);
		const teamsDeclining = orderBy(
			teamSeasons.filter(t => t.dovr < 0),
			"dovr",
			"asc",
		).slice(0, NUM_TEAMS_TO_SHOW);

		// These are used when displaying last year's playoff results, so they are for last season
		const numConfs = g.get("confs", season - 1).length;
		const numPlayoffRounds = g.get("numGamesPlayoffSeries", season - 1).length;

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			numConfs,
			numPlayoffRounds,
			playersDeclining,
			playersImproving,
			playersTop,
			season,
			teamsDeclining,
			teamsImproving,
			teamsTop,
			userTid: g.get("userTid"),
		};
	}
};

export default updateSeasonPreview;
