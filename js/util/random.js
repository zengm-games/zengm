/**
 * @fileoverview Module to emulate some of Python's random library.
 */
var random = {
    /**
     * Choose a random integer from [randMin, randMax]
     * @param {number} randMin Minimum integer that can be returned.
     * @param {number} randMax Maximum integer that can be returned.
     * @return {number} Random integer between randMin and randMax.
     */
    randInt: function (randMin, randMax) {
        return Math.floor(Math.random()*(1 + randMax - randMin)) + randMin;
    },

    /**
     * Shuffles a list in place, returning nothing.
     * @param {array} list List to be shuffled in place.
     */
    shuffle: function (list) {
        var i, j, t;
        var l = list.length;
        for (i = 1; i < l; i++) {
            j = random.randInt(0, i);
            if (j != i) {
                t = list[i];  // swap list[i] and list[j]
                list[i] = list[j];
                list[j] = t;
            }
        }
    }
};
