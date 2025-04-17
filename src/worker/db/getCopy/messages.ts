import { idb } from "../index.ts";
import type { GetCopyType, Message } from "../../../common/types.ts";

const getCopy = async (
	{ mid }: { mid: number },
	type?: GetCopyType,
): Promise<Message | undefined> => {
	const result = await idb.getCopies.messages(
		{
			mid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
