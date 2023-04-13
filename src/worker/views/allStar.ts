import { allStar } from "../core";
import type { UpdateEvents } from "../../common/types";
import { g } from "../util";

const updateAllStar = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const allStars = await allStar.getOrCreate(g.get("season"));
		const showDunk = allStars?.dunk !== undefined;
		const showThree = allStars?.three !== undefined;

		let allStarType;
		if (allStars) {
			// If type not set, it's an old allStar object when draft was the only option
			allStarType = allStars.type ?? "draft";
		} else {
			allStarType = "top";
		}

		return {
			allStarType,
			numPlayersDunk: allStars?.dunk?.players.length ?? g.get("numPlayersDunk"),
			numPlayersThree:
				allStars?.three?.players.length ?? g.get("numPlayersThree"),
			showDunk,
			showThree,
		};
	}
};

export default updateAllStar;
