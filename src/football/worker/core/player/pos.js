// @flow

import type { PlayerRatings } from "../../../common/types";
import ovr from "./ovr";

const positions = [
    "QB",
    "RB",
    "WR",
    "TE",
    "OL",
    "C",
    "DL",
    "LB",
    "CB",
    "S",
    "K",
    "P",
];

const pos = (ratings: PlayerRatings): string => {
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
