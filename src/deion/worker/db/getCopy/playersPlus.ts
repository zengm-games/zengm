import { idb } from "..";
import type {
	Player,
	PlayerFiltered,
	PlayersPlusOptions,
} from "../../../common/types"; // async is only for API consistency, it's not actually needed now that stats are in player objects

const getCopy = async (
	p: Player,
	options: PlayersPlusOptions,
): Promise<PlayerFiltered | void> => {
	const result = await idb.getCopies.playersPlus([p], options);
	return result[0];
};

export default getCopy;
