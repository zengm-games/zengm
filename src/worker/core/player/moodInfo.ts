import { bySport, PHASE, PLAYER } from "../../../common";
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
		(p.contract.exp === season &&
			phase >= PHASE.PLAYOFFS &&
			phase <= PHASE.RESIGN_PLAYERS) ||
		(phase === PHASE.RESIGN_PLAYERS && p.tid === PLAYER.FREE_AGENT)
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
	let sumAndStuff = sumComponents - 0.5;
	if (p.tid === PLAYER.FREE_AGENT) {
		sumAndStuff += helpers.bound(p.numDaysFreeAgent, 0, 30) / 3;
	}
	const valueDiff =
		(p.value - bySport({ football: 85, basketball: 65, hockey: 75 })) / 2;
	sumAndStuff -= valueDiff > 0 ? Math.sqrt(valueDiff) : valueDiff;

	const thisIsAUserTeam = g.get("userTids").includes(tid);

	// More AI players testing free agency
	if (!thisIsAUserTeam) {
		sumAndStuff -= 3;
	}

	let contractAmount =
		overrides.contractAmount !== undefined
			? overrides.contractAmount
			: p.contract.amount;

	// Up to 50% penalty for bad mood
	if (contractAmount > g.get("minContract")) {
		contractAmount *= helpers.bound(1 + (0.5 * -sumComponents) / 10, 1, 1.5);
	}

	contractAmount = helpers.bound(
		helpers.roundContract(contractAmount),
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
		// Decrease that 0.7 to make players less likely to be at extremes (1% or 99%) in mood
		probWilling = 1 / (1 + Math.exp(-0.7 * sumAndStuff));

		const rand = random.uniformSeed(
			tid +
				p.pid +
				p.stats.length +
				p.ratings.at(-1).ovr +
				(p.stats.length > 0 ? p.stats.at(-1).min : 0),
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
