import { season } from "..";
import type { ScheduleGame } from "../../../common/types";

const nextGameIsAllStar = async (schedule?: ScheduleGame[]) => {
	const schedule2 =
		schedule === undefined ? await season.getSchedule() : schedule;
	return (
		schedule2.length > 0 &&
		schedule2[0].homeTid === -1 &&
		schedule2[0].awayTid === -2
	);
};

export default nextGameIsAllStar;
