import gameAttributeHasHistory from "./gameAttributeHasHistory.ts";
import type { GameAttributesLeague } from "./types.ts";

// Get latest value
const unwrapGameAttribute = <T extends keyof GameAttributesLeague>(
	gameAttributes: any,
	key: T,
): GameAttributesLeague[T] => {
	if (gameAttributeHasHistory(gameAttributes[key])) {
		return gameAttributes[key].at(-1).value;
	}

	return gameAttributes[key];
};

export default unwrapGameAttribute;
