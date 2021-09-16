import { allStar } from "../core";
import type { UpdateEvents } from "../../common/types";
import { isSport } from "../../common";
import { g } from "../util";

const updateAllStar = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const allStars = await allStar.getOrCreate(g.get("season"));
		const showDunk = allStars?.dunk !== undefined;
		const showThree = allStars?.dunk !== undefined;

		return {
			showDunk,
			showThree,
		};
	}
};

export default updateAllStar;
