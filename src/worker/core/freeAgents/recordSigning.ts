import { PHASE } from "../../../common/constants.ts";
import { league } from "../index.ts";
import { g, local, lock } from "../../util/index.ts";

const recordSigning = async () => {
	if (local.simulatingFreeAgencyDay) {
		return;
	}

	if (g.get("phase") !== PHASE.FREE_AGENCY) {
		return;
	}

	const threshold = g.get("freeAgencySigningsPerDay");
	if (threshold <= 0) {
		return;
	}

	const count = g.get("freeAgencySigningsThisDay") + 1;
	await league.setGameAttributes({
		freeAgencySigningsThisDay: count,
	});

	if (count >= threshold && !lock.get("gameSim")) {
		const { default: maybeAdvanceDay } = await import("./maybeAdvanceDay.ts");
		void maybeAdvanceDay();
	}
};

export default recordSigning;
