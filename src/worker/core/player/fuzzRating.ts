import { g, helpers } from "../../util/index.ts";

// Split out from fuzzRating so it can be called once when fuzzing many ratings for the same player
export const getFuzz = (fuzz: number, forceFuzz?: boolean): number => {
	// Turn off fuzz in multi team mode, because it doesn't have any meaning there in its current form. The check for
	// existence of variables is because this is sometimes called in league upgrade code when g is not available.
	if (
		!forceFuzz &&
		((Object.hasOwn(g, "userTids") && g.get("userTids").length > 1) ||
			(Object.hasOwn(g, "godMode") && g.get("godMode")))
	) {
		return 0;
	}

	return fuzz;
};

export const applyFuzz = (rating: number, fuzz: number): number => {
	return Math.round(helpers.bound(rating + fuzz, 0, 100));
};

const fuzzRating = (
	rating: number,
	fuzz: number,
	forceFuzz?: boolean,
): number => {
	return applyFuzz(rating, getFuzz(fuzz, forceFuzz));
};

export default fuzzRating;
