// Player stat values are not always numbers. Depending on the sport and stat, they can be byPos arrays (baseball fielding), strings (keyStats), PlayerStatMax tuples (game highs), or undefined in historical data from before a stat was tracked. And since stat keys are shared across sports, the types can't always tell which it is.

// The value if it is a number, otherwise undefined
export const getNumericStat = (value: unknown) =>
	typeof value === "number" ? value : undefined;

// Whether a stat has a non-zero value, counting any non-empty byPos array as non-zero. Used for onlyShowIf in stats tables.
export const hasNonZeroStat = (value: unknown) =>
	(typeof value === "number" && value > 0) ||
	(Array.isArray(value) && value.length > 0);
