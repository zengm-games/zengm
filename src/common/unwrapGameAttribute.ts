import { gameAttributeHasHistory } from "./gameAttributeHasHistory.ts";
import type { GameAttributesLeague } from "./types.ts";
import { last } from "./utils.ts";

// Get latest value
export const unwrapGameAttribute = <T extends keyof GameAttributesLeague>(
	gameAttributes: any,
	key: T,
): GameAttributesLeague[T] => {
	if (gameAttributeHasHistory(gameAttributes[key])) {
		return last(gameAttributes[key]).value;
	}

	return gameAttributes[key];
};
