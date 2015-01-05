/**
 * @name test.helpers
 * @namespace Various utility functions that are only used in tests.
 */
define([], function () {
    "use strict";

   /**
     * Finds the number of times an element appears in an array.
     *
     * @memberOf test.core
     * @param {Array} array The array to search over.
     * @param {*} x Element to search for
     * @return {number} The number of times x was found in array.
     */
    function numInArrayEqualTo(array, x) {
        var idx, n;

        n = 0;
        idx = array.indexOf(x);
        while (idx !== -1) {
            n += 1;
            idx = array.indexOf(x, idx + 1);
        }
        return n;
    }

    return {
        numInArrayEqualTo: numInArrayEqualTo
    };
});
