/**
 * Choose a random integer from [a, b]
 *
 * @memberOf util.random
 * @param {number} a Minimum integer that can be returned.
 * @param {number} b Maximum integer that can be returned.
 * @return {number} Random integer between a and b.
 */
/**
 * Choose a random integer from [a, b]
 *
 * @memberOf util.random
 * @param {number} a Minimum integer that can be returned.
 * @param {number} b Maximum integer that can be returned.
 * @return {number} Random integer between a and b.
 */
/**
 * Choose a random integer from [a, b]
 *
 * @memberOf util.random
 * @param {number} a Minimum integer that can be returned.
 * @param {number} b Maximum integer that can be returned.
 * @return {number} Random integer between a and b.
 */
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
    const l = list.length;
    for (let i = 1; i < l; i++) {
        const j = randInt(0, i);
        if (j !== i) {
            const t = list[i];  // swap list[i] and list[j]
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
 * This is broken and realGauss below is much better. But some things might rely on this broken distribution.
 *
 * @memberOf util.random
 * @param {number} mu Mean (default: 0).
 * @param {number} sigma Standard deviation (default: 1).
 * @return {number} Random number from Gaussian distribution.
 */
function gauss(mu = 0, sigma = 1) {
    return ((Math.random() * 2 - 1) + (Math.random() * 2 - 1) + (Math.random() * 2 - 1)) * sigma + mu;
}

/**
 * Returns a random number from an actually Gaussian distribution.
 *
 * The following implements a random draw via the Marsaglia algorithm.
 * Note that not only is z1 a random Gaussian, but so is z2.
 * If generating random numbers turns out to be a bottleneck, we can
 * cut the time in half by caching z2 rather than throwing it away.
 * For statistician's sake, z1 and z2 are also independent.
 *
 * The Gauss function above is broken, but I don't want to remove it in case
 * other things rely on it. So this is named after the illustrious
 * mysql_real_escape_string function from PHP.
 *
 * @memberOf util.random
 * @param {number} mu Mean (default: 0).
 * @param {number} sigma Standard deviation (default: 1).
 * @return {number} Random number from Gaussian distribution.
 */
function realGauss(mu = 0, sigma = 1) {
    let radius;
    let z1;
    let z2;
    do {
        z1 = 2 * Math.random() - 1;
        z2 = 2 * Math.random() - 1;
        radius = z1 * z1 + z2 * z2;
    } while (radius >= 1 || radius === 0); // only use inside the unit circle

    const marsaglia = Math.sqrt(-2 * Math.log(radius) / radius);

    return (z1 * marsaglia) * sigma + mu;
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

export default {
    randInt,
    shuffle,
    gauss,
    realGauss,
    uniform,
    choice,
};
