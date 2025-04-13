import { idb } from "../index.ts";
import type { GetCopyType, Player } from "../../../common/types.ts";

const getCopy = async (
	{ pid }: { pid: number },
	type?: GetCopyType,
): Promise<Player | undefined> => {
	const result = await idb.getCopies.players(
		{
			pid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
