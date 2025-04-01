import { idb } from "..";
import type { GetCopyType, Game } from "../../../common/types";

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
