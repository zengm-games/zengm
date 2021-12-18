import { idb } from "..";
import type { EventBBGM, GetCopyType } from "../../../common/types";

const getCopy = async (
	{ eid }: { eid: number },
	type?: GetCopyType,
): Promise<EventBBGM | void> => {
	const result = await idb.getCopies.events(
		{
			eid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
