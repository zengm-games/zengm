import { PHASE } from "../../../common/constants.ts";
import play from "./play.ts";
import { g, lock } from "../../util/index.ts";
import type { Conditions } from "../../../common/types.ts";

const maybeAdvanceDay = async (conditions: Conditions = {}) => {
	const threshold = g.get("freeAgencySigningsPerDay");
	if (threshold <= 0) {
		return;
	}

	if (g.get("phase") !== PHASE.FREE_AGENCY) {
		return;
	}

	if (g.get("freeAgencySigningsThisDay") < threshold) {
		return;
	}

	if (lock.get("gameSim")) {
		return;
	}

	if (g.get("daysLeft") <= 0) {
		return;
	}

	await play(1, conditions);
};

export default maybeAdvanceDay;
