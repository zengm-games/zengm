/**
 * Module to emulate some of Python's random library.
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
    }
};
