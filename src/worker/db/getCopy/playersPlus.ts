import { idb } from "../index.ts";
import type {
	Player,
	PlayerFiltered,
	PlayersPlusOptions,
} from "../../../common/types.ts"; // async is only for API consistency, it's not actually needed now that stats are in player objects

const getCopy = async (
	p: Player,
	options: PlayersPlusOptions,
): Promise<PlayerFiltered | undefined> => {
	const result = await idb.getCopies.playersPlus([p], options);
	return result[0];
};

export default getCopy;
