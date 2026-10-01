import { idb } from "../index.ts";
import type { Player, PlayersPlusOptions } from "../../../common/types.ts"; // async is only for API consistency, it's not actually needed now that stats are in player objects

const getCopy = async <Options extends PlayersPlusOptions>(
	p: Player,
	options: Options &
		Record<Exclude<keyof Options, keyof PlayersPlusOptions>, never>,
) => {
	const result = await idb.getCopies.playersPlus<Options>([p], options);
	return result[0];
};

export default getCopy;
