// @flow

import limitRating from "./limitRating";
import { random } from "../../util";
import type { PlayerWithoutPid } from "../../../common/types";
import type {
    RatingKey,
    PlayerRatings,
} from "../../../../basketball/common/types";

const bonus = (p: PlayerWithoutPid<PlayerRatings>) => {
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
        ratings[key] = limitRating(ratings[key] + random.randInt(0, 10));
    }
};

export default bonus;
