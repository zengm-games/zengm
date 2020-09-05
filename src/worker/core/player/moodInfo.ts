import { PLAYER } from "../../../common";
import { g, helpers, random } from "../../util";
import { idb } from "../../db";
import moodComponents from "./moodComponents";

const moodInfo = async (pid: number, tid: number) => {
	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("No player found");
	}

	const components = await moodComponents(p, tid);
	let sumAndStuff = 0;
	for (const value of Object.values(components)) {
		sumAndStuff += value;
	}

	// Add some based on how long free agency has lasted and how good/bad the player is
	sumAndStuff +=
		helpers.bound(p.numDaysFreeAgent, 0, 30) / 3 - (p.value - 47) / 10;

	const probWilling = 1 / (1 + Math.exp(-sumAndStuff));

	let willing = false;
	if (p.tid === PLAYER.FREE_AGENT) {
		const rand = random.uniformSeed(
			p.pid + p.stats.length + p.ratings[p.ratings.length - 1].ovr,
		);
		willing = rand < probWilling;
	}

	return {
		components,
		traits: p.moodTraits,
		probWilling,
		willing,
	};
};

export default moodInfo;
