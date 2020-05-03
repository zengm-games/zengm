import { idb } from "../../db";
import { g, toUI, initUILocalGames, local } from "../../util";
import { gameAttributeHasHistory } from "../../util/g";
import type { GameAttributesLeague } from "../../../common/types";
import { helpers, PHASE } from "../../../common";

const updateMetaDifficulty = async (difficulty: number) => {
	if (local.autoSave) {
		const l = await idb.meta.get("leagues", g.get("lid"));

		if (l) {
			l.difficulty = difficulty;
			await idb.meta.put("leagues", l);
		}
	}
};

const wrap = <T extends keyof GameAttributesLeague>(
	gameAttributes: any,
	key: T,
	value: GameAttributesLeague[T],
) => {
	if (!gameAttributeHasHistory(gameAttributes[key])) {
		return value;
	}

	const latestRow = gameAttributes[key][gameAttributes[key].length - 1];

	let currentSeason = g.get("season");
	// Currently this applies to confs, divs, and numGamesPlayoffSeries, which all can only be changed for this season before the playoffs
	if (g.get("phase") >= PHASE.PLAYOFFS) {
		currentSeason += 1;
	}

	// This mutates, but the result supposed to be updated immediately anyway, so whatever
	if (latestRow.start === currentSeason) {
		latestRow.value = value;
	} else {
		gameAttributes[key].push({
			start: currentSeason,
			value,
		});
	}

	return gameAttributes[key];
};

// Get latest value
const unwrap = (gameAttributes: any, key: keyof GameAttributesLeague) => {
	if (gameAttributeHasHistory(gameAttributes[key])) {
		return gameAttributes[key][gameAttributes[key].length - 1].value;
	}

	return gameAttributes[key];
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
			toUpdate.push(key);
		}
	}

	for (const key of toUpdate) {
		const value = wrap(g, key, gameAttributes[key]);

		await idb.cache.gameAttributes.put({
			key,
			value,
		});
		g.setWithoutSavingToDB(key, value);

		if (key === "difficulty") {
			await updateMetaDifficulty(g.get(key));
		}
	}

	await toUI("setGameAttributes", [gameAttributes]);

	if (toUpdate.includes("userTid")) {
		await initUILocalGames();
	}
};

export default setGameAttributes;
