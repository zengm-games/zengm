import g from "./g.ts";
import getProcessedGames from "./getProcessedGames.ts";
import toUI from "./toUI.ts";
import type { LocalStateUI } from "../../common/types.ts";
import { getOneUpcomingGame } from "./recomputeLocalUITeamOvrs.ts";

const initUILocalGames = async () => {
	const userTid = g.get("userTid");

	// Start with completed games
	const games: LocalStateUI["games"] = (
		await getProcessedGames({
			tid: userTid,
			season: g.get("season"),
			includeAllStarGame: true,
		})
	).map((game) => ({
		forceWin: game.forceWin,
		gid: game.gid,
		overtimes: game.overtimes,
		numPeriods: game.numPeriods,
		teams: [
			{
				ovr: game.teams[0].ovr,
				pts: game.teams[0].pts,
				sPts: game.teams[0].sPts,
				tid: game.teams[0].tid,
				playoffs: game.teams[0].playoffs,
			},
			{
				ovr: game.teams[1].ovr,
				pts: game.teams[1].pts,
				sPts: game.teams[1].sPts,
				tid: game.teams[1].tid,
				playoffs: game.teams[1].playoffs,
			},
		],
	}));
	games.reverse();

	// Add one upcoming game - that's all that's ever shown in the UI
	const upcomingGame = await getOneUpcomingGame();
	if (upcomingGame) {
		games.push(upcomingGame);
	}

	await toUI("updateLocal", [
		{
			games,
		},
	]);
};

export default initUILocalGames;
