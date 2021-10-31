import { PHASE } from "./constants";
import type { Phase } from "./types";
import isSport from "./isSport";

// Probably this logic should be used in GameSim too, cause it is the same there
const allowForceTie = ({
	homeTid,
	awayTid,
	ties,
	phase,
	elam,
	elamASG,
}: {
	homeTid: number;
	awayTid: number;
	ties: boolean;
	phase: Phase;
	elam: boolean;
	elamASG: boolean;
}) => {
	if (!ties) {
		return false;
	}

	if (phase === PHASE.PLAYOFFS) {
		return false;
	}

	if (isSport("basketball")) {
		if (elam) {
			return false;
		}

		const isAllStarGame = homeTid === -1 && awayTid === -2;

		if (isAllStarGame && elamASG) {
			return false;
		}
	}

	return true;
};

export default allowForceTie;
