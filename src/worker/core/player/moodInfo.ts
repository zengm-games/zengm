import { bySport, isSport, PHASE, PLAYER } from "../../../common";
import { g, helpers, random } from "../../util";
import { idb } from "../../db";
import moodComponents from "./moodComponents";
import type { Player } from "../../../common/types";

const hasActiveNegotiation = async (tid: number, pid: number) => {
	const teamNegotiations = (await idb.cache.negotiations.getAll()).filter(
		negotiation => negotiation.tid === tid,
	);

	return teamNegotiations.some(negotiation => negotiation.pid === pid);
};

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
	for (const key of helpers.keys(components)) {
		if (key === "custom") {
			for (const row of components.custom!) {
				sumComponents += row.amount;
			}
		} else {
			sumComponents += components[key];
		}
	}

	// Add some based on how long free agency has lasted and how good/bad the player is
	let sumAndStuff = sumComponents - 0.5;
	if (p.tid === PLAYER.FREE_AGENT) {
		sumAndStuff += helpers.bound(p.numDaysFreeAgent, 0, 30) / 3;
	}

	let valueDiff =
		(p.value -
			bySport({ baseball: 75, basketball: 65, football: 85, hockey: 75 })) /
		2;

	// It's annoying to root against your player improving, but you do that for very good players sometimes. This prevents that from happening by capping valueDiff, but only when you're re-signing your own player
	const MAX_RESIGNING_VALUE_DIFF = 4;
	if (valueDiff > MAX_RESIGNING_VALUE_DIFF) {
		// Is player really re-signing? Otherwise do nothing.
		if (
			p.tid === tid ||
			(resigning &&
				p.tid === PLAYER.FREE_AGENT &&
				(await hasActiveNegotiation(tid, p.pid)))
		) {
			valueDiff = MAX_RESIGNING_VALUE_DIFF;
		}
	}

	sumAndStuff -= valueDiff > 0 ? Math.sqrt(valueDiff) : valueDiff;

	const thisIsAUserTeam = g.get("userTids").includes(tid);

	// More AI players testing free agency
	if (!thisIsAUserTeam) {
		sumAndStuff -= 3;
	}

	let contractAmount = overrides.contractAmount ?? p.contract.amount;

	// Up to 50% penalty for bad mood, except if this is a rookie contract
	const autoRookieContract =
		components.rookieContract > 0 && g.get("draftPickAutoContract");
	if (!autoRookieContract && contractAmount > g.get("minContract")) {
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
		firstSeasonAfterExpansionOverride ||
		contractAmount === g.get("minContract")
	) {
		probWilling = 1;
		willing = true;
	} else if (components.rookieContract > 0 && !g.get("rookiesCanRefuse")) {
		probWilling = 1;
		willing = true;
	} else {
		// Decrease that 0.7 to make players less likely to be at extremes (1% or 99%) in mood
		probWilling = 1 / (1 + Math.exp(-0.7 * sumAndStuff));

		let seed =
			tid +
			p.pid +
			p.stats.length +
			p.ratings.at(-1).ovr +
			(p.stats.at(-1)?.min ?? 0);

		if (isSport("baseball")) {
			// Since min is 0 in baseball
			seed += (p.stats.at(-1)?.pa ?? 0) + (p.stats.at(-1)?.outs ?? 0);
		}

		const rand = random.uniformSeed(seed);
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
