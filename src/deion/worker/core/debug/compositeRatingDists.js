// @flow

import backboard from "backboard";
import { PLAYER } from "../../../common";
import { COMPOSITE_WEIGHTS } from "../../../../basketball/common";
import { player } from "..";
import { idb } from "../../db";

const compositeRatingDists = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    const compositeRatings = players
        .map(p => {
            return player.compositeRating(
                p.ratings[p.ratings.length - 1],
                COMPOSITE_WEIGHTS.shootingThreePointer.ratings,
                COMPOSITE_WEIGHTS.shootingThreePointer.weights,
                false,
            );
        })
        .sort((a, b) => b - a);

    console.log(compositeRatings);
};

export default compositeRatingDists;
