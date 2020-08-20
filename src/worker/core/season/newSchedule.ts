import newScheduleBasketball from "./newSchedule.basketball";
import newScheduleFootball from "./newSchedule.football";

const newSchedule = (
	teams: {
		seasonAttrs: {
			cid: number;
			did: number;
		};
		tid: number;
	}[],
) => {
	if (process.env.SPORT === "football") {
		return newScheduleFootball(teams);
	}

	return newScheduleBasketball(teams);
};

export default newSchedule;
