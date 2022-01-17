import { player, season, team } from "../core";
import { idb } from "../db";
import { g, getProcessedGames } from "../util";
import type { UpdateEvents, ViewInput, Game } from "../../common/types";
import orderBy from "lodash-es/orderBy";
import { bySport, PHASE } from "../../common";

export const getUpcoming = async ({
	day,
	limit = Infinity,
	oneDay,
	tid,
}: {
	day?: number;
	limit?: number;
	oneDay?: boolean;
	tid?: number;
}) => {
	let schedule = await season.getSchedule(oneDay);
	if (day !== undefined) {
		schedule = schedule.filter(game => game.day === day);
	}

	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["tid"],
			seasonAttrs: ["won", "lost", "tied", "otl"],
			season: g.get("season"),
			active: true,
		},
		"noCopyCache",
	);

	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);
	const healthyPlayers = await idb.getCopies.playersPlus(
		playersRaw.filter(p => p.injury.gamesRemaining === 0),
		{
			attrs: ["tid", "pid", "value"],
			ratings: ["ovr", "pos", "ovrs"],
			season: g.get("season"),
			fuzz: true,
		},
	);

	const ovrsCache = new Map<number, number>();

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	const roundSeries = playoffSeries
		? playoffSeries.currentRound === -1 && playoffSeries.playIns
			? playoffSeries.playIns.flat()
			: playoffSeries.series[playoffSeries.currentRound]
		: undefined;

	const getTeam = (tid: number) => {
		let ovr = ovrsCache.get(tid);
		if (ovr === undefined) {
			ovr = team.ovr(
				healthyPlayers.filter(p => p.tid === tid),
				{
					playoffs: g.get("phase") === PHASE.PLAYOFFS,
				},
			);
			ovrsCache.set(tid, ovr);
		}

		if (tid < 0) {
			return { tid };
		}

		let playoffs:
			| {
					seed: number;
					won: number;
					lost: number;
			  }
			| undefined;
		if (roundSeries) {
			for (const series of roundSeries) {
				if (series.home.tid === tid) {
					playoffs = {
						seed: series.home.seed,
						won: series.home.won,
						lost: series.away ? series.away.won : 0,
					};
				} else if (series.away && series.away.tid === tid) {
					playoffs = {
						seed: series.away.seed,
						won: series.away.won,
						lost: series.home.won,
					};
				}
			}
		}

		const t = teams.find(t2 => t2.tid === tid);

		if (!t) {
			throw new Error(`No team found for tid ${tid}`);
		}

		return {
			ovr,
			tid,
			won: t.seasonAttrs.won,
			lost: t.seasonAttrs.lost,
			tied: t.seasonAttrs.tied,
			otl: t.seasonAttrs.otl,
			playoffs,
		};
	};

	const filteredSchedule = schedule
		.filter(
			game =>
				tid === undefined ||
				tid === game.homeTid ||
				tid === game.awayTid ||
				(game.homeTid === -1 && game.awayTid === -2) ||
				(game.homeTid === -3 && game.awayTid === -3),
		)
		.slice(0, limit);

	const upcoming: {
		forceWin?: number | "tie";
		gid: number;
		season: number;
		teams: [ReturnType<typeof getTeam>, ReturnType<typeof getTeam>];
	}[] = filteredSchedule.map(({ awayTid, forceWin, gid, homeTid }) => {
		return {
			forceWin,
			gid,
			season: g.get("season"),
			teams: [getTeam(homeTid), getTeam(awayTid)],
		};
	});

	return upcoming;
};

const updateUpcoming = async (
	inputs: ViewInput<"schedule">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		inputs.abbrev !== state.abbrev
	) {
		const upcoming = await getUpcoming({
			tid: inputs.tid,
		});

		let canLiveSimFirstGame = false;
		if (upcoming.length > 0) {
			const scheduleToday = await season.getSchedule(true);
			canLiveSimFirstGame = scheduleToday.some(
				game => game.gid === upcoming[0].gid,
			);
		}

		return {
			abbrev: inputs.abbrev,
			canLiveSimFirstGame,
			elam: g.get("elam"),
			elamASG: g.get("elamASG"),
			phase: g.get("phase"),
			tid: inputs.tid,
			ties: g.get("ties", "current"),
			upcoming,
		};
	}
};

export const getTopPlayers = async (
	skipTid: number | undefined,
	numPerTeam: number,
) => {
	const topPlayers: Record<number, any[]> = {};

	const teamInfoCache = g.get("teamInfoCache");

	for (let tid = 0; tid < teamInfoCache.length; tid++) {
		const t = teamInfoCache[tid];
		if (t.disabled || tid === skipTid) {
			continue;
		}

		const playersRaw = orderBy(
			await idb.cache.players.indexGetAll("playersByTid", tid),
			t => {
				const ratings = t.ratings.at(-1);
				const ovr = player.fuzzRating(ratings.ovr, ratings.fuzz);
				return ovr;
			},
			"desc",
		)
			.slice(0, numPerTeam)
			.reverse();

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: ["pid", "name", "injury", "abbrev", "tid"],
			ratings: ["ovr", "pos"],
			season: g.get("season"),
			stats: bySport({
				basketball: ["pts", "trb", "ast"],
				football: undefined, // football keyStats is too long
				hockey: ["keyStats"],
			}),
			tid,
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

		topPlayers[tid] = players;
	}

	return topPlayers;
};

// Based on views.gameLog.updateGamesList
const updateCompleted = async (
	inputs: ViewInput<"schedule">,
	updateEvents: UpdateEvents,
	state: {
		abbrev: string;
		completed: Game[];
	},
) => {
	if (updateEvents.includes("firstRun") || inputs.abbrev !== state.abbrev) {
		// Load all games in list
		const completed = await getProcessedGames({
			abbrev: inputs.abbrev,
			season: g.get("season"),
			includeAllStarGame: true,
		});

		const topPlayers = await getTopPlayers(inputs.tid, 2);

		return {
			completed,
			topPlayers,
		};
	}

	if (updateEvents.includes("gameSim")) {
		// Partial update of only new games
		const completed = Array.isArray(state.completed) ? state.completed : [];

		const games = await getProcessedGames({
			abbrev: inputs.abbrev,
			season: g.get("season"),
			loadedGames: state.completed,
			includeAllStarGame: true,
		});

		for (let i = games.length - 1; i >= 0; i--) {
			completed.unshift(games[i]);
		}

		const topPlayers = await getTopPlayers(inputs.tid, 2);

		return {
			completed,
			topPlayers,
		};
	}
};

export default async (
	inputs: ViewInput<"schedule">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	return Object.assign(
		{},
		await updateUpcoming(inputs, updateEvents, state),
		await updateCompleted(inputs, updateEvents, state),
	);
};
