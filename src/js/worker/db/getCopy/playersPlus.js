// @flow

import { idb } from "../../db";
import type { Player, PlayerFiltered } from "../../../common/types";
import type { PlayerOptions } from "../getCopies/playersPlus";

const getCopy = async (
    p: Player,
    options: PlayerOptions,
): Promise<PlayerFiltered | void> => {
    const result = await idb.getCopies.playersPlus([p], options);
    return result[0];
};

export default getCopy;
