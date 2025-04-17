import { idb } from "../index.ts";
import type { EventBBGM, GetCopyType } from "../../../common/types.ts";

const getCopy = async (
	{ eid }: { eid: number },
	type?: GetCopyType,
): Promise<EventBBGM | undefined> => {
	const result = await idb.getCopies.events(
		{
			eid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
