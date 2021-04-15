import gameAttributeHasHistory from "./gameAttributeHasHistory";
import type { GameAttributesLeague } from "./types";

// Get latest value
const unwrapGameAttribute = <T extends keyof GameAttributesLeague>(
	gameAttributes: any,
	key: T,
): GameAttributesLeague[T] => {
	if (gameAttributeHasHistory(gameAttributes[key])) {
		return gameAttributes[key][gameAttributes[key].length - 1].value;
	}

	return gameAttributes[key];
};

export default unwrapGameAttribute;
