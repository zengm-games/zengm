import { idb } from "..";
import type { GetCopyType, Player } from "../../../common/types";

const getCopy = async (
	{ pid }: { pid: number },
	type?: GetCopyType,
): Promise<Player | void> => {
	const result = await idb.getCopies.players(
		{
			pid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
