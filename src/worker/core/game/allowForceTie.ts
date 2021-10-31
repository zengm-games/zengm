import { isSport, PHASE } from "../../../common";
import type { ScheduleGame } from "../../../common/types";
import { g } from "../../util";

// Probably this logic should be used in GameSim too, cause it is the same there
const allowForceTie = (game: ScheduleGame) => {
	if (!g.get("ties", "current")) {
		return false;
	}

	if (g.get("phase") === PHASE.PLAYOFFS) {
		return false;
	}

	if (isSport("basketball")) {
		if (g.get("elam")) {
			return false;
		}

		const isAllStarGame = game.homeTid === -1 && game.awayTid === -2;

		if (isAllStarGame && g.get("elamASG")) {
			return false;
		}
	}

	return true;
};

export default allowForceTie;
