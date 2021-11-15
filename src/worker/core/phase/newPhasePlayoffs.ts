import { finances, player, season, team } from "..";
import { idb } from "../../db";
import { achievement, g, helpers, local, logEvent } from "../../util";
import type {
	Conditions,
	PhaseReturn,
	PlayoffSeries,
} from "../../../common/types";

const newPhasePlayoffs = async (
	conditions: Conditions,
	liveGameSim: boolean = false,
): Promise<PhaseReturn> => {
	achievement.check("afterRegularSeason", conditions);

	// In case this was somehow set already
	local.playingUntilEndOfRound = false;

	// Set playoff matchups
	const { byConf, playIns, series, tidPlayIn, tidPlayoffs } =
		await season.genPlayoffSeries();

	for (const type of ["playoffs", "play-in tournament"] as const) {
		const tids = type === "playoffs" ? tidPlayoffs : tidPlayIn;

		for (const tid of tids) {
			logEvent(
				{
					type: "madePlayoffs",
					text: `The <a href="${helpers.leagueUrl([
						"roster",
						`${g.get("teamInfoCache")[tid]?.abbrev}_${tid}`,
						g.get("season"),
					])}">${
						g.get("teamInfoCache")[tid]?.name
					}</a> made the <a href="${helpers.leagueUrl([
						"playoffs",
						g.get("season"),
					])}">${type}</a>.`,
					showNotification: tid === g.get("userTid"),
					tids: [tid],
					score: 0,
				},
				conditions,
			);
		}
	}

	const playoffSeries: PlayoffSeries = {
		byConf,
		season: g.get("season"),
		currentRound: 0,
		series,
	};
	if (playIns) {
		playoffSeries.currentRound = -1;
		playoffSeries.playIns = playIns;
	}
	await idb.cache.playoffSeries.put(playoffSeries);

	// Add row to team stats and team season attributes
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[g.get("season")], [g.get("season"), "Z"]],
	);

	const tidAll = new Set([...tidPlayoffs, ...tidPlayIn]);

	for (const teamSeason of teamSeasons) {
		if (tidAll.has(teamSeason.tid)) {
			await idb.cache.teamStats.add(team.genStatsRow(teamSeason.tid, true));

			// Play-in teams have not made the playoffs yet, technically
			if (tidPlayoffs.includes(teamSeason.tid)) {
				teamSeason.playoffRoundsWon = 0;
			}

			// More hype for making the playoffs
			teamSeason.hype += 0.05;

			if (teamSeason.hype > 1) {
				teamSeason.hype = 1;
			}
		} else {
			// Less hype for missing the playoffs
			teamSeason.hype -= 0.05;

			if (teamSeason.hype < 0) {
				teamSeason.hype = 0;
			}
		}

		// Average age and team ovr, cache now that season is over
		const playersRaw = await idb.cache.players.indexGetAll(
			"playersByTid",
			teamSeason.tid,
		);
		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: ["age", "value"],
			fuzz: true,
			stats: ["gp", "min"],
			ratings: ["ovr", "pos", "ovrs"],
			season: g.get("season"),
			tid: teamSeason.tid,
		});
		teamSeason.avgAge = team.avgAge(players);
		teamSeason.ovrEnd = team.ovr(players);

		await idb.cache.teamSeasons.put(teamSeason);
	}

	// Add row to player stats
	for (const tid of tidAll) {
		const players = await idb.cache.players.indexGetAll("playersByTid", tid);

		for (const p of players) {
			await player.addStatsRow(p, true);
			await idb.cache.players.put(p);
		}
	}

	await finances.assessPayrollMinLuxury();
	await season.newSchedulePlayoffsDay();

	// Update clinchedPlayoffs with final values
	await team.updateClinchedPlayoffs(true, conditions);

	// Don't redirect if we're viewing a live game now
	let url;
	if (!liveGameSim) {
		url = helpers.leagueUrl(["playoffs"]);
	}

	return {
		url,
		updateEvents: ["teamFinances"],
	};
};

export default newPhasePlayoffs;
