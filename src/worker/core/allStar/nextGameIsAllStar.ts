import { season } from "../index.ts";
import type { ScheduleGame } from "../../../common/types.ts";

const nextGameIsAllStar = async (schedule?: ScheduleGame[]) => {
	const schedule2 = schedule ?? (await season.getSchedule());
	return schedule2[0]?.homeTid === -1 && schedule2[0].awayTid === -2;
};

export default nextGameIsAllStar;
