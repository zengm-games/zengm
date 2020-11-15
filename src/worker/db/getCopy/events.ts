import { idb } from "..";
import type { EventBBGM } from "../../../common/types";

const getCopy = async ({ eid }: { eid: number }): Promise<EventBBGM | void> => {
	const result = await idb.getCopies.events({
		eid,
	});
	return result[0];
};

export default getCopy;
