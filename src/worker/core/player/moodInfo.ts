import { PHASE } from "../../../common";
import { g, helpers, random } from "../../util";
import { idb } from "../../db";
import moodComponents from "./moodComponents";
import type { Player } from "../../../common/types";

const moodInfo = async (
	p: Player,
	tid: number,
	overrides: {
		contractAmount?: number;
	} = {},
) => {
	const components = await moodComponents(p, tid);
	let probWilling = 0;

	const phase = g.get("phase");
	const season = g.get("season");

	const resigning = phase === PHASE.RESIGN_PLAYERS;
	const rookie =
		phase >= PHASE.DRAFT &&
		phase <= PHASE.RESIGN_PLAYERS &&
		p.draft.year === season;

	let firstSeasonAfterExpansionOverride = false;
	if (
		p.contract.exp === season &&
		phase >= PHASE.PLAYOFFS &&
		phase <= PHASE.RESIGN_PLAYERS
	) {
		const t = await idb.cache.teams.get(tid);
		if (
			t &&
			t.firstSeasonAfterExpansion !== undefined &&
			t.firstSeasonAfterExpansion - 1 === season
		) {
			firstSeasonAfterExpansionOverride = true;
		}
	}

	let sumComponents = 0;
	for (const value of Object.values(components)) {
		sumComponents += value;
	}

	// Add some based on how long free agency has lasted and how good/bad the player is
	let sumAndStuff = sumComponents;
	sumAndStuff += helpers.bound(p.numDaysFreeAgent, 0, 30) / 3;
	const valueDiff =
		(p.value - (process.env.SPORT === "football" ? 85 : 65)) / 2;
	sumAndStuff -= valueDiff > 0 ? Math.sqrt(valueDiff) : valueDiff;

	let contractAmount =
		overrides.contractAmount !== undefined
			? overrides.contractAmount
			: p.contract.amount;

	// Up to 50% penalty for bad mood
	if (contractAmount > g.get("minContract")) {
		contractAmount *= helpers.bound(1 + (0.5 * -sumComponents) / 10, 1, 1.5);
	}

	contractAmount = helpers.bound(
		50 * Math.round(contractAmount / 50), // Make it a multiple of 50k
		g.get("minContract"),
		g.get("maxContract"),
	);

	let willing = false;
	if (
		!g.get("playersRefuseToNegotiate") ||
		rookie ||
		firstSeasonAfterExpansionOverride
	) {
		probWilling = 1;
		willing = true;
	} else if (components.rookieContract > 0 && !g.get("rookiesCanRefuse")) {
		probWilling = 1;
		willing = true;
	} else {
		probWilling = 1 / (1 + Math.exp(-sumAndStuff));

		const rand = random.uniformSeed(
			p.pid +
				p.stats.length +
				p.ratings[p.ratings.length - 1].ovr +
				(p.stats.length > 0 ? p.stats[0].min : 0),
		);
		willing = rand < probWilling;
	}

	// Outside the above if/else so it plays nice with any branch
	if (
		g.get("challengeNoFreeAgents") &&
		!resigning &&
		contractAmount * 0.99 > g.get("minContract")
	) {
		willing = false;
	}

	return {
		components,
		traits: g.get("playerMoodTraits") ? p.moodTraits : [],
		probWilling,
		willing,
		contractAmount,
	};
};

export default moodInfo;
