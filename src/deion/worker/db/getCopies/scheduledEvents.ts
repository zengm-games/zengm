import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { ScheduledEvent } from "../../../common/types";

const getCopies = async (): Promise<ScheduledEvent[]> => {
	return mergeByPk(
		await idb.league.getAll("scheduledEvents"),
		await idb.cache.scheduledEvents.getAll(),
		"scheduledEvents",
	);
};

export default getCopies;
