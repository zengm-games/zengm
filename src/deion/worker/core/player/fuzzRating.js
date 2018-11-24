// @flow

import { g, helpers } from "../../util";

const fuzzRating = (rating: number, fuzz: number): number => {
    // Turn off fuzz in multi team mode, because it doesn't have any meaning there in its current form. The check for
    // existence of variables is because this is sometimes called in league upgrade code when g is not available and
    // would be difficult to make available due to Firefox promise/IDB/worker issues.
    if ((g.hasOwnProperty("userTids") && g.userTids.length > 1) || g.godMode) {
        fuzz = 0;
    }

    return Math.round(helpers.bound(rating + fuzz, 0, 100));
};

export default fuzzRating;
