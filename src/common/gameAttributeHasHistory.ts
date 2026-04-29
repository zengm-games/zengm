import type {
	GameAttributesLeague,
	GameAttributeWithHistory,
} from "./types.ts";

export const gameAttributeHasHistory = <
	T extends GameAttributesLeague[keyof GameAttributesLeague],
>(
	gameAttribute: T | GameAttributeWithHistory<T>,
): gameAttribute is GameAttributeWithHistory<T> => {
	return (
		Array.isArray(gameAttribute) &&
		!!gameAttribute[0] &&
		// null check is for league files before importing, since there is no -Infinity in JSON
		(typeof (gameAttribute[0] as any).start === "number" ||
			(gameAttribute[0] as any).start === null)
	);
};
