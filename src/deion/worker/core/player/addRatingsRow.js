// @flow

import genFuzz from "./genFuzz";
import { g } from "../../util";
import type {
    MinimalPlayerRatings,
    Player,
    PlayerWithoutPid,
} from "../../../common/types";

/**
 * Add a new row of ratings to a player object.
 *
 * There should be one ratings row for each year a player is not retired, and a new row should be added for each non-retired player at the start of a season.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {number} scoutingRank Between 1 and g.numTeams (default 30), the rank of scouting spending, probably over the past 3 years via core.finances.getRankLastThree.
 * @return {Object} Updated player object.
 */
const addRatingsRow = (
    p: Player<MinimalPlayerRatings> | PlayerWithoutPid<MinimalPlayerRatings>,
    scoutingRank: number,
) => {
    const newRatings = {
        ...p.ratings[p.ratings.length - 1],
    };
    newRatings.season = g.season;
    newRatings.fuzz = (newRatings.fuzz + genFuzz(scoutingRank)) / 2;
    p.ratings.push(newRatings);
};

export default addRatingsRow;
