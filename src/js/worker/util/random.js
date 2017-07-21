// @flow

/**
 * Choose a random integer from [a, b]
 *
 * @memberOf util.random
 * @param {number} a Minimum integer that can be returned.
 * @param {number} b Maximum integer that can be returned.
 * @return {number} Random integer between a and b.
 */
function randInt(a: number, b: number): number {
    return Math.floor(Math.random() * (1 + b - a)) + a;
}

/**
 * Shuffles a list in place, returning nothing.
 *
 * @memberOf util.random
 * @param {array} list List to be shuffled in place.
 */
function shuffle(list: any[]) {
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
function gauss(mu?: number = 0, sigma?: number = 1): number {
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
function realGauss(mu?: number = 0, sigma?: number = 1): number {
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
function uniform(a: number, b: number): number {
    return Math.random() * (b - a) + a;
}

/**
 * Choose a random element from a non-empty array.
 *
 * @memberOf util.random
 * @param {number} x Array to choose a random value from.
 */
function choice<T>(x: T[]): T {
    return x[Math.floor(Math.random() * x.length)];
}

/**
 * Custom probability distribution to determine player heights
 */
function heightDist(): number {
    let r = Math.random();
	if (r < 0.000000000051653) {
	    return 54;
	} else if (r < 0.000000000103306) {
	    return 55;
	} else if (r < 0.000000000206612) {
	    return 56;
	} else if (r < 0.000000000309917) {
	    return 57;
	} else if (r < 0.000000000413223) {
	    return 58;
	} else if (r < 0.000000000568182) {
	    return 59;
	} else if (r < 0.000000000723140) {
	    return 60;
	} else if (r < 0.000001033780992) {
	    return 61;
	} else if (r < 0.000011364359504) {
	    return 62;
	} else if (r < 0.000063017252066) {
	    return 63;
	} else if (r < 0.000140496590909) {
	    return 64;
	} else if (r < 0.000295455268595) {
	    return 65;
	} else if (r < 0.000811984194215) {
	    return 66;
	} else if (r < 0.001380166012397) {
	    return 67;
	} else if (r < 0.002066115702479) {
	    return 68;
	} else if (r < 0.004132231404959) {
	    return 69;
	} else if (r < 0.008780991735537) {
	    return 70;
	} else if (r < 0.012913223140496) {
	    return 71;
	} else if (r < 0.041838842975207) {
	    return 72;
	} else if (r < 0.083161157024793) {
	    return 73;
	} else if (r < 0.126549586776860) {
	    return 74;
	} else if (r < 0.196797520661157) {
	    return 75;
	} else if (r < 0.267045454545455) {
	    return 76;
	} else if (r < 0.337809917355372) {
	    return 77;
	} else if (r < 0.419421487603306) {
	    return 78;
	} else if (r < 0.521694214876033) {
	    return 79;
	} else if (r < 0.623966942148760) {
	    return 80;
	} else if (r < 0.739669421487603) {
	    return 81;
	} else if (r < 0.832128099173554) {
	    return 82;
	} else if (r < 0.915805785123967) {
	    return 83;
	} else if (r < 0.967458677685951) {
	    return 84;
	} else if (r < 0.984504132231405) {
	    return 85;
	} else if (r < 0.991735537190083) {
	    return 86;
	} else if (r < 0.995351239669422) {
	    return 87;
	} else if (r < 0.997417355371901) {
	    return 88;
	} else if (r < 0.998192148760331) {
	    return 89;
	} else if (r < 0.998708677685951) {
	    return 90;
	} else if (r < 0.999225206611570) {
	    return 91;
	} else if (r < 0.999700413223141) {
	    return 92;
	} else if (r < 0.999834710743802) {
	    return 93;
	} else if (r < 0.999950929752066) {
	    return 94;
	} else if (r < 0.999981921487604) {
	    return 95;
	} else if (r < 0.999994318181818) {
	    return 96;
	} else if (r < 0.999998347107438) {
	    return 97;
	} else if (r < 0.999999457644628) {
	    return 98;
	} else if (r < 0.999999819214876) {
	    return 99;
	} else if (r < 0.999999961260331) {
	    return 100;
	} else if (r < 0.999999980630165) {
	    return 101;
	} else if (r < 0.999999997417356) {
	    return 102;
	} else if (r < 0.999999999328513) {
	    return 103;
	} else if (r < 0.999999999793389) {
	    return 104;
	} else if (r < 0.999999999845042) {
	    return 105;
	} else if (r < 0.999999999896694) {
	    return 106;
	} else if (r < 0.999999999948347) {
	    return 107;
	} else {
	    return 108;
	}
}
 

export default {
    randInt,
    shuffle,
    gauss,
    realGauss,
    uniform,
    choice,
	heightDist,
};
