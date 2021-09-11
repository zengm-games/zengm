import { allStar } from "../core";
import type { UpdateEvents } from "../../common/types";
import { isSport } from "../../common";

const updateAllStar = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (!isSport("basketball")) {
		throw new Error("Not implemented");
	}

	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const allStars = await allStar.getOrCreate();
		const showDunk = allStars.dunk !== undefined;

		return {
			showDunk,
		};
	}
};

export default updateAllStar;
