import { PHASE, PLAYER } from "../../../common";
import { g, helpers, random } from "../../util";
import { idb } from "../../db";
import moodComponents from "./moodComponents";
import { freeAgents } from "..";
import genContract from "./genContract";

const moodInfo = async (pid: number, tid: number) => {
	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("No player found");
	}

	const components = await moodComponents(p, tid);
	let probWilling = 0;

	const resigning = g.get("phase") === PHASE.RESIGN_PLAYERS;
	const rookie = resigning && p.draft.year === g.get("season");

	let sumAndStuff = 0;
	for (const value of Object.values(components)) {
		sumAndStuff += value;
	}

	// Add some based on how long free agency has lasted and how good/bad the player is
	sumAndStuff += helpers.bound(p.numDaysFreeAgent, 0, 30) / 3;
	sumAndStuff -= p.value - 60;

	// For free agents, contract demand is stored in p.contract.amount
	// For upcoming free agents, need some way to specify that contract should be determined dynamically
	// Otherwise, contractAmount is not meaningful
	let contractAmount = p.contract.amount;

	let willing = false;
	if (!g.get("playersRefuseToNegotiate") || rookie) {
		probWilling = 1;
		willing = true;
	} else if (
		g.get("challengeNoFreeAgents") &&
		!resigning &&
		contractAmount * 0.99 > g.get("minContract")
	) {
		probWilling = 0;
		willing = false;
	} else {
		probWilling = 1 / (1 + Math.exp(-sumAndStuff));

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
		contractAmount,
	};
};

export default moodInfo;
