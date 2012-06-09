/**
 * @fileoverview Module to emulate some of Python's random library.
 */
var random = {
    /**
     * Choose a random integer from [a, b]
     * @param {number} a Minimum integer that can be returned.
     * @param {number} b Maximum integer that can be returned.
     * @return {number} Random integer between a and b.
     */
    randInt: function (a, b) {
        return Math.floor(Math.random()*(1 + b - a)) + a;
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
    },

    /**
     * Returns a random number from an approximately Gaussian distribution.
     * See: http://www.protonfish.com/random.shtml
     * @param {number} mu Mean (default: 0).
     * @param {number} sigma Standard deviation (default: 1).
     * @return {number} Random number from Gaussian distribution.
     */
    gauss: function (mu, sigma) {
        mu = typeof mu !== "undefined" ? mu : 0;
        sigma = typeof sigma !== "undefined" ? sigma : 1;
        return ((Math.random()*2-1)+(Math.random()*2-1)+(Math.random()*2-1))*sigma + mu;
    },

    /**
     * Get a random number selected from a uniform distribution.
     * @param {number} a Minimum number that can be returned.
     * @param {number} b Maximum number that can be returned.
     * @return {number} Random number from uniform distribution.
     */
    uniform: function (a, b) {
        return math.Random()*(b - a) + a;
    }
};
