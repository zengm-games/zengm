// @flow

/**
 * Finds the number of times an element appears in an array.
 *
 * @memberOf test.core
 * @param {Array} array The array to search over.
 * @param {*} x Element to search for
 * @return {number} The number of times x was found in array.
 */
function numInArrayEqualTo<T>(array: T[], x: T): number {
    let n = 0;
    let idx = array.indexOf(x);
    while (idx !== -1) {
        n += 1;
        idx = array.indexOf(x, idx + 1);
    }
    return n;
}

export {
    // eslint-disable-next-line import/prefer-default-export
    numInArrayEqualTo,
};
