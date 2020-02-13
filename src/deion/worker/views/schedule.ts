import { season } from "../core";
import { idb } from "../db";
import { g, getProcessedGames, overrides } from "../util";
import { UpdateEvents, ViewInput, Game } from "../../common/types";

export const getUpcoming = async (tid: number, limit: number = Infinity) => {
	const schedule = await season.getSchedule();
	const teams = await idb.getCopies.teamsPlus({
		attrs: ["tid"],
		seasonAttrs: ["won", "lost", "tied"],
		season: g.get("season"),
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
				ovr: p.ratings[p.ratings.length - 1].ovr,
				pos: p.ratings[p.ratings.length - 1].pos,
			},
			tid: p.tid,
		}));

	const ovrsCache = new Map<number, number>();

	const getTeam = (tid: number) => {
		let ovr = ovrsCache.get(tid);
		if (ovr === undefined) {
			ovr = overrides.core.team.ovr!(healthyPlayers.filter(p => p.tid === tid));
			ovrsCache.set(tid, ovr);
		}

		return {
			ovr,
			tid,
			won: teams[tid].seasonAttrs.won,
			lost: teams[tid].seasonAttrs.lost,
			tied: g.get("ties") ? teams[tid].seasonAttrs.tied : undefined,
		};
	};

	const filteredSchedule = schedule
		.filter(game => tid === game.homeTid || tid === game.awayTid)
		.slice(0, limit);

	const upcoming: {
		gid: number;
		season: number;
		teams: [ReturnType<typeof getTeam>, ReturnType<typeof getTeam>];
	}[] = filteredSchedule.map(({ awayTid, gid, homeTid }) => {
		return {
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
		const upcoming = await getUpcoming(inputs.tid);

		return {
			abbrev: inputs.abbrev,
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
		/*// Reset list, so old completed games don't temporarily show when switching team
          if (state.completed) {
              setState({completed: undefined});
          }*/
		// Load all games in list
		const completed = await getProcessedGames(inputs.abbrev, g.get("season"));
		return {
			completed,
		};
	}

	if (updateEvents.includes("gameSim")) {
		const completed = Array.isArray(state.completed) ? state.completed : []; // Partial update of only new games

		const games = await getProcessedGames(
			inputs.abbrev,
			g.get("season"),
			state.completed,
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
