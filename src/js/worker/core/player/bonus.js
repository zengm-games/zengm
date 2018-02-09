// @flow

import { player } from "../../core";
import { random } from "../../util";
import type { RatingKey, PlayerWithoutPid } from "../../../common/types";

const bonus = (p: PlayerWithoutPid) => {
    const ratings = p.ratings[p.ratings.length - 1];

    const keys: RatingKey[] = [
        "hgt",
        "stre",
        "spd",
        "jmp",
        "endu",
        "ins",
        "dnk",
        "ft",
        "fg",
        "tp",
        "oiq",
        "diq",
        "drb",
        "pss",
        "reb",
    ];

    for (const key of keys) {
        ratings[key] = player.limitRating(ratings[key] + random.randInt(0, 10));
    }
};

export default bonus;
