import g from "./g";
import getProcessedGames from "./getProcessedGames";
import toUI from "./toUI";
import type { LocalStateUI } from "../../common/types";
import { getUpcoming } from "../views/schedule";

const initUILocalGames = async () => {
	const userTid = g.get("userTid");

	// Start with completed games
	const games: LocalStateUI["games"] = (
		await getProcessedGames(g.get("teamAbbrevsCache")[userTid], g.get("season"))
	).map(game => ({
		gid: game.gid,
		teams: [
			{
				ovr: game.teams[0].ovr,
				pts: game.teams[0].pts,
				tid: game.teams[0].tid,
			},
			{
				ovr: game.teams[1].ovr,
				pts: game.teams[1].pts,
				tid: game.teams[1].tid,
			},
		],
	}));
	games.reverse();

	// Add upcoming games
	const upcoming = await getUpcoming(userTid);
	for (const game of upcoming) {
		games.push({
			gid: game.gid,
			teams: [
				{
					ovr: game.teams[0].ovr,
					tid: game.teams[0].tid,
				},
				{
					ovr: game.teams[1].ovr,
					tid: game.teams[1].tid,
				},
			],
		});
	}

	await toUI("setLocal", [
		{
			games,
		},
	]);
};

export default initUILocalGames;
