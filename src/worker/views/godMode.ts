import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateGodMode = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			godMode: g.get("godMode"),
		};
	}
};

export default updateGodMode;
