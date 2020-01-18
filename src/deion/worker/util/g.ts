import { GameAttributes, GameAttributesLeague } from "../../common/types"; // This will get filled by values from IndexedDB

const g: GameAttributes & {
	get: <T extends keyof GameAttributesLeague>(
		key: T,
	) => GameAttributesLeague[T];
} = {
	lid: undefined,

	get: key => {
		if (g.hasOwnProperty(key)) {
			// @ts-ignore
			return g[key];
		}

		throw new Error(`Attempt to access g.${key} while it is not set`);
	},
};

export default g;
