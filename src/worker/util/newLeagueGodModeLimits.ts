import { DEFAULT_STADIUM_CAPACITY } from "../../common/constants.basketball";
import teamInfos from "../../common/teamInfos";

const newLeagueGodModeLimits = () => {
	const pop = Math.max(...Object.values(teamInfos).map(t => t.pop));

	return {
		pop,
		stadiumCapacity: DEFAULT_STADIUM_CAPACITY,
	};
};

export default newLeagueGodModeLimits;
