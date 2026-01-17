import type { LocalStateUI } from "../../common/types.ts";
import { getUpcoming } from "../views/schedule.ts";
import g from "./g.ts";
import toUI from "./toUI.ts";

export const getOneUpcomingGame = async (): Promise<
	LocalStateUI["games"][number] | undefined
> => {
	const game = (
		await getUpcoming({
			tid: g.get("userTid"),
			onlyOneGame: true,
		})
	)[0];
	if (game) {
		return {
			finals: game.finals,
			gid: game.gid,
			teams: [
				{
					ovr: game.teams[0].ovr,
					tid: game.teams[0].tid,
					playoffs: game.teams[0].playoffs,
				},
				{
					ovr: game.teams[1].ovr,
					tid: game.teams[1].tid,
					playoffs: game.teams[1].playoffs,
				},
			],
		};
	}
};

const recomputeLocalUITeamOvrs = async () => {
	// Only need to recompute ovrs for the user's upcoming game, no other ones are shown in UI
	const upcomingGame = await getOneUpcomingGame();
	if (upcomingGame) {
		await toUI("mergeGames", [[upcomingGame]]);
	}
};

export default recomputeLocalUITeamOvrs;
