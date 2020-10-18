import { season, player, team } from "../core";
import { idb } from "../db";
import { g, getProcessedGames } from "../util";
import type { UpdateEvents, ViewInput, Game } from "../../common/types";
import { PHASE } from "../../common";

export const getUpcoming = async ({
	tid,
	limit = Infinity,
	oneDay,
}: {
	tid?: number;
	limit?: number;
	oneDay?: boolean;
}) => {
	const schedule = await season.getSchedule(oneDay);
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: ["won", "lost", "tied"],
		season: g.get("season"),
		active: true,
	});

	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);
	const healthyPlayers = playersRaw
		.filter(p => p.injury.gamesRemaining === 0)
		.map(p => ({
			pid: p.pid,
			ratings: {
				ovr: player.fuzzRating(
					p.ratings[p.ratings.length - 1].ovr,
					p.ratings[p.ratings.length - 1].fuzz,
				),
				pos: p.ratings[p.ratings.length - 1].pos,
			},
			tid: p.tid,
		}));

	const ovrsCache = new Map<number, number>();

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	const roundSeries = playoffSeries
		? playoffSeries.series[playoffSeries.currentRound]
		: undefined;

	const getTeam = (tid: number) => {
		let ovr = ovrsCache.get(tid);
		if (ovr === undefined) {
			ovr = team.ovr(healthyPlayers.filter(p => p.tid === tid));
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
		if (g.get("phase") === PHASE.PLAYOFFS && roundSeries) {
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
		forceWin?: number;
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
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		inputs.abbrev !== state.abbrev
	) {
		const upcoming = await getUpcoming({
			tid: inputs.tid,
		});

		return {
			abbrev: inputs.abbrev,
			tid: inputs.tid,
			upcoming,
		};
	}
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
		const completed = await getProcessedGames(
			inputs.abbrev,
			g.get("season"),
			undefined,
			true,
		);

		return {
			completed,
		};
	}

	if (updateEvents.includes("gameSim")) {
		// Partial update of only new games
		const completed = Array.isArray(state.completed) ? state.completed : [];

		const games = await getProcessedGames(
			inputs.abbrev,
			g.get("season"),
			state.completed,
			true,
		);

		for (let i = games.length - 1; i >= 0; i--) {
			completed.unshift(games[i]);
		}

		return {
			completed,
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
