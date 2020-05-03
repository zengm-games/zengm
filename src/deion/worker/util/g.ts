import type { GameAttributes, GameAttributesLeague } from "../../common/types"; // This will get filled by values from IndexedDB

export const gameAttributeHasHistory = (gameAttribute: any) => {
	return (
		Array.isArray(gameAttribute) &&
		gameAttribute.length > 0 &&
		typeof gameAttribute[0].start === "number"
	);
};

const g: GameAttributes & {
	get: <T extends keyof GameAttributesLeague>(
		key: T,
		season?: number,
	) => GameAttributesLeague[T];
	setWithoutSavingToDB: <T extends keyof GameAttributesLeague>(
		key: T,
		value: GameAttributesLeague[T],
	) => void;
} = {
	lid: undefined,

	get: (key, season) => {
		if (g.hasOwnProperty(key)) {
			// @ts-ignore
			const gameAttribute = g[key];

			if (gameAttributeHasHistory(gameAttribute)) {
				// Return value from row with highest starting season that is still <= the current season
				let toReturn = gameAttribute[0].value;
				// @ts-ignore
				const season2 = season === undefined ? g.season : season;
				for (const row of gameAttribute) {
					if (row.start > season2) {
						break;
					}
					toReturn = row.value;
				}
				return toReturn;
			}

			// @ts-ignore
			return gameAttribute;
		}

		throw new Error(`Attempt to get g.${key} while it is not already set`);
	},

	setWithoutSavingToDB: (key, value) => {
		// Should this error when setting a key that doesn't exist, like setting a value form GameAttributesLeague when not in a league? Maybe, but need a way to initialize it first.
		// @ts-ignore
		g[key] = value;
	},
};

export default g;
