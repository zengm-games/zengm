/**
 * Limit a rating to between 0 and 100.
 *
 * @memberOf core.player
 * @param {number} rating Input rating.
 * @return {number} If rating is below 0, 0. If rating is above 100, 100. Otherwise, rating.
 */
const limitRating = (rating: number): number => {
	if (rating > 100) {
		return 100;
	}

	if (rating < 0) {
		return 0;
	}

	return Math.floor(rating);
};

export default limitRating;
