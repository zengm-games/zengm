import { idb } from "..";
import type { GetCopyType, Message } from "../../../common/types";

const getCopy = async (
	{ mid }: { mid: number },
	type?: GetCopyType,
): Promise<Message | void> => {
	const result = await idb.getCopies.messages(
		{
			mid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
