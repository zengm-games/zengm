// @flow

import backboard from "backboard";
import { PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";
import { overrides } from "../../util";

const compositeRatingDists = async () => {
    // All non-retired players
    const players = await idb.league.players
        .index("tid")
        .getAll(backboard.lowerBound(PLAYER.FREE_AGENT));

    const compositeRatings = players
        .map(p => {
            return player.compositeRating(
                p.ratings[p.ratings.length - 1],
                overrides.common.constants.COMPOSITE_WEIGHTS
                    .shootingThreePointer.ratings,
                overrides.common.constants.COMPOSITE_WEIGHTS
                    .shootingThreePointer.weights,
                false,
            );
        })
        .sort((a, b) => b - a);

    console.log(compositeRatings);
};

export default compositeRatingDists;
