// @flow

import { generate as generateFace } from "facesjs";
import { idb } from "../db";
import type { MinimalPlayerRatings, Player } from "../../common/types";

const generate = () => {
    const id = process.env.SPORT === "basketball" ? "jersey3" : "football";

    return generateFace({ jersey: { id } });
};

const upgrade = async (p: Player<MinimalPlayerRatings>) => {
    if (!p.face || !p.face.accessories) {
        p.face2 = p.face;
        p.face = generate();
        await idb.cache.players.put(p);
    }
};

export default { generate, upgrade };
