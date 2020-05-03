import { idb } from "../../db";
import { g, toUI, initUILocalGames, local } from "../../util";
import { unwrap, wrap } from "../../util/g";
import type { GameAttributesLeague } from "../../../common/types";
import { helpers } from "../../../common";

const updateMetaDifficulty = async (difficulty: number) => {
	if (local.autoSave) {
		const l = await idb.meta.get("leagues", g.get("lid"));

		if (l) {
			l.difficulty = difficulty;
			await idb.meta.put("leagues", l);
		}
	}
};

const setGameAttributes = async (
	gameAttributes: Partial<GameAttributesLeague>,
) => {
	const toUpdate: (keyof GameAttributesLeague)[] = [];

	for (const key of helpers.keys(gameAttributes)) {
		const currentValue = unwrap(g, key);

		if (
			// @ts-ignore
			(gameAttributes[key] === undefined ||
				currentValue !== gameAttributes[key]) &&
			// @ts-ignore
			!Number.isNaN(gameAttributes[key])
		) {
			// No needless update for arrays - this matters for wrapped values like numGamesPlayoffSeries so it doesn't create an extra entry every year!
			if (Array.isArray(gameAttributes[key])) {
				if (
					JSON.stringify(gameAttributes[key]) === JSON.stringify(currentValue)
				) {
					continue;
				}
			}
			toUpdate.push(key);
		}
	}

	// Will contain the wrapped values too
	const updated: any = {
		...gameAttributes,
	};

	for (const key of toUpdate) {
		const value = wrap(g, key, gameAttributes[key]);
		updated[key] = value;

		await idb.cache.gameAttributes.put({
			key,
			value,
		});
		g.setWithoutSavingToDB(key, value);

		if (key === "difficulty") {
			await updateMetaDifficulty(g.get(key));
		}
	}

	await toUI("setGameAttributes", [updated]);

	if (toUpdate.includes("userTid")) {
		await initUILocalGames();
	}
};

export default setGameAttributes;
