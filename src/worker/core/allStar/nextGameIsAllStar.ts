import { season } from "../index.ts";
import type { ScheduleGame } from "../../../common/types.ts";
import { isAllStarGame } from "../../../common/specialGames.ts";

const nextGameIsAllStar = async (schedule?: ScheduleGame[]) => {
	const schedule2 = schedule ?? (await season.getSchedule());
	const game = schedule2[0];
	return game !== undefined && isAllStarGame(game.homeTid, game.awayTid);
};

export default nextGameIsAllStar;
