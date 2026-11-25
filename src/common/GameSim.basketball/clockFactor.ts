export const SHOT_CLOCK = 24;

/**
 * How the offense manages the clock on a basketball possession, or undefined for a normal possession. This is used by GameSim.basketball and by the live win probability model, which needs to know what GameSim will do in the closing seconds.
 *
 * pointDifferential is the offense's lead, t is the seconds left in the period, and numFoulsUntilBonus is for the defense.
 */
export const getBasketballClockFactor = ({
	finalPeriod,
	numFoulsUntilBonus,
	pointDifferential,
	t,
}: {
	finalPeriod: boolean;
	numFoulsUntilBonus: number;
	pointDifferential: number;
	t: number;
}) => {
	// Defense fouls to stop the clock
	if (
		finalPeriod &&
		pointDifferential > 0 &&
		pointDifferential <= 6 &&
		t < 27 &&
		t > 0.3 &&
		numFoulsUntilBonus <= 10
	) {
		return "intentionalFoul" as const;
	}

	// Run out the clock if winning
	if (finalPeriod && t <= SHOT_CLOCK && pointDifferential > 0) {
		return "runOutClock" as const;
	}

	if (t <= 26 && (!finalPeriod || pointDifferential >= 0)) {
		return "holdForLastShot" as const;
	}

	if (
		finalPeriod &&
		((t <= 3 * 60 && pointDifferential <= -10) ||
			(t <= 2 * 60 && pointDifferential <= -5) ||
			(t <= 1 * 60 && pointDifferential < 0))
	) {
		return "catchUp" as const;
	}
	if (
		finalPeriod &&
		((t <= 3 * 60 && pointDifferential > 10) ||
			(t <= 2 * 60 && pointDifferential > 5) ||
			(t <= 1 * 60 && pointDifferential > 0))
	) {
		return "maintainLead" as const;
	}

	if (t >= 32 && t <= 52) {
		return "twoForOne" as const;
	}
};

export type BasketballClockFactor = ReturnType<typeof getBasketballClockFactor>;
