import { idb } from "..";
import { mergeByPk } from "./helpers";
import type { GetCopyType, ScheduledEvent } from "../../../common/types";

const getCopies = async (
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
