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
			numPlayersDunk: allStars?.dunk?.players.length ?? g.get("numPlayersDunk"),
			numPlayersThree:
				allStars?.three?.players.length ?? g.get("numPlayersThree"),
			showDunk,
			showThree,
		};
	}
};

export default updateAllStar;
