import { season } from "../index.ts";

const futureGameIsAllStar = async () => {
	const schedule = await season.getSchedule();
	return schedule.some(
		({ homeTid, awayTid }) => homeTid === -1 && awayTid === -2,
	);
};

export default futureGameIsAllStar;
