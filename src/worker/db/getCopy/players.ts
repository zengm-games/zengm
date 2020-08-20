import { idb } from "..";
import type { Player } from "../../../common/types";

const getCopy = async ({ pid }: { pid: number }): Promise<Player | void> => {
	const result = await idb.getCopies.players({
		pid,
	});
	return result[0];
};

export default getCopy;
