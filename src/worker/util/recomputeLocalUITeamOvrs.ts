import { getOneUpcomingGame } from "../core/season/setSchedule.ts";
import toUI from "./toUI.ts";

const recomputeLocalUITeamOvrs = async () => {
	// Only need to recompute ovrs for the user's upcoming game, no other ones are shown in UI
	const upcomingGame = await getOneUpcomingGame();
	if (upcomingGame) {
		await toUI("mergeGames", [[upcomingGame]]);
	}
};

export default recomputeLocalUITeamOvrs;
