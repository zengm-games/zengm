import { allStar } from "../core";
import type { UpdateEvents } from "../../common/types";

const updateAllStar = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const allStars = await allStar.getOrCreate();
		const showDunk = allStars.dunk !== undefined;

		return {
			showDunk,
		};
	}
};

export default updateAllStar;
