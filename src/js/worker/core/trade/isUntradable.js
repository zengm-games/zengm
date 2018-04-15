// @flow

import filterUntradable from "./filterUntradable";

/**
 * Is a player untradable.
 *
 * Just calls filterUntradable and discards everything but the boolean.
 *
 * @memberOf core.trade
 * @param {Object} p Player object or partial player object
 * @return {boolean} Processed input
 */
const isUntradable = (p: any): boolean => {
    return filterUntradable([p])[0].untradable;
};

export default isUntradable;
