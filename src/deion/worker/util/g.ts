import type { GameAttributes, GameAttributesLeague } from "../../common/types"; // This will get filled by values from IndexedDB

const g: GameAttributes & {
	get: <T extends keyof GameAttributesLeague>(
		key: T,
	) => GameAttributesLeague[T];
	setWithoutSavingToDB: <T extends keyof GameAttributesLeague>(
		key: T,
		value: GameAttributesLeague[T],
	) => void;
} = {
	lid: undefined,

	get: key => {
		if (g.hasOwnProperty(key)) {
			// @ts-ignore
			return g[key];
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
