/**
 * @name util.random
 * @namespace Module to emulate some of Python's random library.
 */
define([], function () {
    "use strict";
    /**
     * Choose a random integer from [a, b]
     * 
     * @memberOf util.random
     * @param {number} a Minimum integer that can be returned.
     * @param {number} b Maximum integer that can be returned.
     * @return {number} Random integer between a and b.
     */
    function randInt(a, b) {
        return Math.floor(Math.random() * (1 + b - a)) + a;
    }

    /**
     * Shuffles a list in place, returning nothing.
     * 
     * @memberOf util.random
     * @param {array} list List to be shuffled in place.
     */
    function shuffle(list) {
        var i, j, l, t;

        l = list.length;
        for (i = 1; i < l; i++) {
            j = randInt(0, i);
            if (j !== i) {
                t = list[i];  // swap list[i] and list[j]
                list[i] = list[j];
                list[j] = t;
            }
        }
    }

    /**
     * Returns a random number from an approximately Gaussian distribution.
     * 
     * See: http://www.protonfish.com/random.shtml
     * 
     * @memberOf util.random
     * @param {number} mu Mean (default: 0).
     * @param {number} sigma Standard deviation (default: 1).
     * @return {number} Random number from Gaussian distribution.
     */
    function gauss(mu, sigma) {
        mu = mu !== undefined ? mu : 0;
        sigma = sigma !== undefined ? sigma : 1;
        return ((Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1)) * sigma + mu;
    }

    /**
     * Get a random number selected from a uniform distribution.
     * 
     * @memberOf util.random
     * @param {number} a Minimum number that can be returned.
     * @param {number} b Maximum number that can be returned.
     * @return {number} Random number from uniform distribution.
     */
    function uniform(a, b) {
        return Math.random() * (b - a) + a;
    }

    /**
     * Choose a random element from a non-empty array.
     * 
     * @memberOf util.random
     * @param {number} x Array to choose a random value from.
     */
    function choice(x) {
        return x[Math.floor(Math.random() * x.length)];
    }

    return {
        randInt: randInt,
        shuffle: shuffle,
        gauss: gauss,
        uniform: uniform,
        choice: choice
    };
});
