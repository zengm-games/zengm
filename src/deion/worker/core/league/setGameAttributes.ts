import { idb } from "../../db";
import { g, toUI } from "../../util";
import { GameAttributesLeague } from "../../../common/types";
import { helpers } from "../../../common";

const updateMetaDifficulty = async (difficulty: number) => {
	const l = await idb.meta.leagues.get(g.get("lid"));

	if (l) {
		l.difficulty = difficulty;
		await idb.meta.leagues.put(l);
	}
};

/**
 * Set values in the gameAttributes objectStore and update the global variable g.
 *
 * Items stored in gameAttributes are globally available through the global variable g. If a value is a constant across all leagues/games/whatever, it should just be set in globals.js instead.
 *
 * @param {Object} gameAttributes Each property in the object will be inserted/updated in the database with the key of the object representing the key in the database.
 * @returns {Promise} Promise for when it finishes.
 */
const setGameAttributes = async (
	gameAttributes: Partial<GameAttributesLeague>,
) => {
	const toUpdate: (keyof GameAttributesLeague)[] = [];

	for (const key of helpers.keys(gameAttributes)) {
		if (
			(gameAttributes[key] === undefined || g[key] !== gameAttributes[key]) &&
			// @ts-ignore
			!Number.isNaN(gameAttributes[key])
		) {
			toUpdate.push(key);
		}
	}

	for (const key of toUpdate) {
		await idb.cache.gameAttributes.put({
			key,
			value: gameAttributes[key],
		});
		g.setWithoutSavingToDB(key, gameAttributes[key]);

		if (key === "difficulty") {
			await updateMetaDifficulty(g.get(key));
		}
	}

	await toUI(["setGameAttributes", gameAttributes]);
};

export default setGameAttributes;
