import type { UpdateEvents, ViewInput } from "../../common/types";
import { idb } from "../db";

const updateTradeSummary = async (
	{ eid }: ViewInput<"tradeSummary">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		eid !== state.eid
	) {
		const event = await idb.getCopy.events({ eid });
		if (!event) {
			return {
				eid,
			};
		}

		return {
			eid,
		};
	}
};

export default updateTradeSummary;
