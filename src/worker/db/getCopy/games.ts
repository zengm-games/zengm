import { idb } from "../index.ts";
import type { GetCopyType, Game } from "../../../common/types.ts";

const getCopy = async (
	{
		gid,
	}: {
		gid: number;
	},
	type?: GetCopyType,
): Promise<Game | undefined> => {
	const result = await idb.getCopies.games(
		{
			gid,
		},
		type,
	);
	return result[0];
};

export default getCopy;
