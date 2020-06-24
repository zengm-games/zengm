import { g } from "../../util";
import { realRosters } from "..";

const skipEndOfSeasonPhases = async () => {
	if (g.get("repeatSeason")) {
		return true;
	}

	if (g.get("realPlayerMovementDeterminism")) {
		const state = await realRosters.movementDeterminism.getState();
		if (g.get("season") < state.maxSeason) {
			return true;
		}
	}

	return false;
};

export default skipEndOfSeasonPhases;
