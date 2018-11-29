// @flow;

import { overrides } from "../../util";
import type {
    Player,
    PlayerFiltered,
    PlayersPlusOptions,
} from "../../../common/types";

const playersPlus = (
    p: Player<>[],
    options: PlayersPlusOptions,
): Promise<PlayerFiltered[]> => {
    if (!overrides.db.getCopies.playersPlus) {
        throw new Error("Missing overrides.db.getCopies.playersPlus");
    }
    return overrides.db.getCopies.playersPlus(p, options);
};

export default playersPlus;
