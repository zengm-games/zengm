import { DEFAULT_STADIUM_CAPACITY } from "../../common";
import teamInfos from "../../common/teamInfos";

const newLeagueGodModeLimits = () => {
	const pop = Math.max(...Object.values(teamInfos).map(t => t.pop));

	return {
		pop,
		stadiumCapacity: DEFAULT_STADIUM_CAPACITY,
	};
};

export default newLeagueGodModeLimits;
