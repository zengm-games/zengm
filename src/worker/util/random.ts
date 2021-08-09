/**
 * Choose a random integer from [a, b]
 *
 * @memberOf util.random
 * @param {number} a Minimum integer that can be returned.
 * @param {number} b Maximum integer that can be returned.
 * @return {number} Random integer between a and b.
 */
const randInt = (a: number, b: number): number => {
	return Math.floor(Math.random() * (1 + b - a)) + a;
};

/**
 * Shuffles a list in place, returning nothing.
 *
 * @memberOf util.random
 * @param {array} list List to be shuffled in place.
 */
const shuffle = (list: any[]) => {
	const l = list.length;

	for (let i = 1; i < l; i++) {
		const j = randInt(0, i);

		if (j !== i) {
			const t = list[i]; // swap list[i] and list[j]

			list[i] = list[j];
			list[j] = t;
		}
	}
};

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
const gauss = (mu: number = 0, sigma: number = 1): number => {
	return (
		(Math.random() * 2 -
			1 +
			(Math.random() * 2 - 1) +
			(Math.random() * 2 - 1)) *
			sigma +
		mu
	);
};

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
const realGauss = (mu: number = 0, sigma: number = 1): number => {
	let radius;
	let z1;
	let z2;

	do {
		z1 = 2 * Math.random() - 1;
		z2 = 2 * Math.random() - 1;
		radius = z1 * z1 + z2 * z2;
	} while (radius >= 1 || radius === 0); // only use inside the unit circle

	const marsaglia = Math.sqrt((-2 * Math.log(radius)) / radius);
	return z1 * marsaglia * sigma + mu;
};

const truncGauss = (
	mu: number = 0,
	sigma: number = 1,
	lowerBound: number = -Infinity,
	upperBound: number = Infinity,
) => {
	let x;

	let i = -1;
	do {
		i += 1;
		if (i > 1000000) {
			throw new Error("Could not find valid random number");
		}

		x = realGauss(mu, sigma);
	} while (x < lowerBound || x > upperBound);

	return x;
};

/**
 * Get a random number selected from a uniform distribution.
 *
 * @memberOf util.random
 * @param {number} a Minimum number that can be returned.
 * @param {number} b Maximum number that can be returned.
 * @return {number} Random number from uniform distribution.
 */
const uniform = (a: number, b: number): number => {
	return Math.random() * (b - a) + a;
};

// https://stackoverflow.com/a/19303725/786644
const uniformSeed = (seed: number): number => {
	const x = Math.sin(seed) * 10000;
	return x - Math.floor(x);
};

/**
 * Choose a random element from a non-empty array.
 *
 * @memberOf util.random
 * @param {number} x Array to choose a random value from.
 */
const choice = <T>(
	x: T[],
	weightInput?: ((a: T, index: number) => number) | number[],
): T => {
	if (weightInput === undefined) {
		return x[Math.floor(Math.random() * x.length)];
	}

	let weights;
	if (Array.isArray(weightInput)) {
		weights = weightInput;
	} else {
		weights = x.map(weightInput);
	}
	weights = weights.map(weight =>
		weight < 0 || Number.isNaN(weight) ? Number.MIN_VALUE : weight,
	);

	const cumsums = weights.reduce<number[]>((array, weight, i) => {
		if (i === 0) {
			array[0] = weight;
		} else {
			array[i] = array[i - 1] + weight;
		}

		return array;
	}, []);
	const max = cumsums.at(-1);
	const rand = Math.random() * max;
	const ind = cumsums.findIndex(cumsum => cumsum >= rand);
	return x[ind];
};

/**
 * Custom probability distribution to determine player heights
 *
 * Source: List of heights of all NBA players from 1966, 1976, 1986, 1996, 2006, and 2016
 * For 5'9" to 7'4", frequency counts are used to determine probability of seeing that height.
 * In a couple of places (6'4" and 6'8") the numbers were averaged with an adjacent height
 * to produce a smoother curve.
 * For the extremes, this distribution uses approximately the
 * same values as produced by a gamma distribution that would result
 * by fitting the same data.  5'3" and 7'9" are the shortest and tallest anyone should
 * reasonably expect to see.  Anything beyond that comes around less than 1 in 700 draft classes.
 */
const heightDist = (): number => {
	const r = Math.random();

	if (r < 0.000000000051653) {
		return 54;
	}

	if (r < 0.000000000258264) {
		return 55;
	}

	if (r < 0.000000001084711) {
		return 56;
	}

	if (r < 0.000000004390496) {
		return 57;
	}

	if (r < 0.000000017561983) {
		return 58;
	}

	if (r < 0.000000069214876) {
		return 59;
	}

	if (r < 0.000000275826446) {
		return 60;
	}

	if (r < 0.000001308884298) {
		return 61;
	}

	if (r < 0.00001163946281) {
		return 62;
	}

	if (r < 0.000063292355372) {
		return 63;
	}

	if (r < 0.000218251033058) {
		return 64;
	}

	if (r < 0.000476515495868) {
		return 65;
	}

	if (r < 0.000838085743802) {
		return 66;
	}

	if (r < 0.00130296177686) {
		return 67;
	}

	if (r < 0.002066115702479) {
		return 68;
	}

	if (r < 0.004132231404959) {
		return 69;
	}

	if (r < 0.008780991735537) {
		return 70;
	}

	if (r < 0.012913223140496) {
		return 71;
	}

	if (r < 0.041838842975207) {
		return 72;
	}

	if (r < 0.083161157024793) {
		return 73;
	}

	if (r < 0.12654958677686) {
		return 74;
	}

	if (r < 0.196797520661157) {
		return 75;
	}

	if (r < 0.267045454545455) {
		return 76;
	}

	if (r < 0.337809917355372) {
		return 77;
	}

	if (r < 0.419421487603306) {
		return 78;
	}

	if (r < 0.521694214876033) {
		return 79;
	}

	if (r < 0.62396694214876) {
		return 80;
	}

	if (r < 0.739669421487603) {
		return 81;
	}

	if (r < 0.832128099173554) {
		return 82;
	}

	if (r < 0.915805785123967) {
		return 83;
	}

	if (r < 0.967458677685951) {
		return 84;
	}

	if (r < 0.984504132231405) {
		return 85;
	}

	if (r < 0.991735537190083) {
		return 86;
	}

	if (r < 0.995351239669422) {
		return 87;
	}

	if (r < 0.997417355371901) {
		return 88;
	}

	if (r < 0.998243801652893) {
		return 89;
	}

	if (r < 0.999018595041323) {
		return 90;
	}

	if (r < 0.99974173553719) {
		return 91;
	}

	if (r < 0.999870867097108) {
		return 92;
	}

	if (r < 0.999917354700413) {
		return 93;
	}

	if (r < 0.999950929080579) {
		return 94;
	}

	if (r < 0.99997675552686) {
		return 95;
	}

	if (r < 0.999988377427686) {
		return 96;
	}

	if (r < 0.99999612536157) {
		return 97;
	}

	if (r < 0.999999456973141) {
		return 98;
	}

	if (r < 0.999999818543389) {
		return 99;
	}

	if (r < 0.999999934762397) {
		return 100;
	}

	if (r < 0.999999979958678) {
		return 101;
	}

	if (r < 0.999999991580579) {
		return 102;
	}

	if (r < 0.999999997572314) {
		return 103;
	}

	if (r < 0.999999999225207) {
		return 104;
	}

	if (r < 0.99999999963843) {
		return 105;
	}

	if (r < 0.999999999845042) {
		return 106;
	}

	if (r < 0.999999999948347) {
		return 107;
	}

	return 108;
};

export default {
	randInt,
	shuffle,
	gauss,
	realGauss,
	truncGauss,
	uniform,
	uniformSeed,
	choice,
	heightDist,
};
