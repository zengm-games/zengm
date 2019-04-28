// @flow

import { overrides } from "../../../../deion/worker/util";
import ovr from "./ovr";
import type { PlayerRatings } from "../../../common/types";

const pos = (ratings: PlayerRatings): string => {
    const positions = overrides.common.constants.POSITIONS.filter(
        pos2 => pos2 !== "KR" && pos2 !== "PR",
    );

    const ovrs = positions.map(position => ovr(ratings, position));
    let ind = 0;
    let max = 0;
    for (let i = 0; i < ovrs.length; i++) {
        if (ovrs[i] > max) {
            max = ovrs[i];
            ind = i;
        }
    }

    return positions[ind];
};

export default pos;
