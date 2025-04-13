import { idb } from "../index.ts";
import { mergeByPk } from "./helpers.ts";
import type { GetCopyType, ScheduledEvent } from "../../../common/types.ts";

const getCopies = async (
	options: any = {},
	type?: GetCopyType,
): Promise<ScheduledEvent[]> => {
	return mergeByPk(
		await idb.league.getAll("scheduledEvents"),
		await idb.cache.scheduledEvents.getAll(),
		"scheduledEvents",
		type,
	);
};

export default getCopies;
