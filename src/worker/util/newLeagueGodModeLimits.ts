import { DEFAULT_STADIUM_CAPACITY } from "../../common/index.ts";
import teamInfos from "../../common/teamInfos.ts";

const newLeagueGodModeLimits = () => {
	const pop = Math.max(...Object.values(teamInfos).map((t) => t.pop));

	return {
		pop,
		stadiumCapacity: DEFAULT_STADIUM_CAPACITY,
	};
};

export default newLeagueGodModeLimits;
