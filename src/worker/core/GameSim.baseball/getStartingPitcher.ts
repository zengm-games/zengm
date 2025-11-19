import { PHASE } from "../../../common/index.ts";
import { NUM_STARTING_PITCHERS } from "../../../common/constants.baseball.ts";
import { g, random } from "../../util/index.ts";
import type { PlayerInjury } from "../../../common/types.ts";

export const CLOSER_INDEX = NUM_STARTING_PITCHERS;

// Designed to support Player objects and PlayerGameSim objects
type PartialPlayer = {
	injured?: boolean;
	injury?: PlayerInjury;
	pFatigue?: number;
};

const isHealthy = (p: PartialPlayer) => {
	return !p.injured && (!p.injury || p.injury.gamesRemaining === 0);
};

export const getStartingPitcher = <
	T extends {
		injured?: boolean;
		injury?: PlayerInjury;
		pFatigue?: number;
	},
>(
	pitchers: T[],
	allStarGame: boolean,
) => {
	if (allStarGame) {
		return pitchers[0]!;
	}

	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	// First pass - look for starting pitcher with no fatigue
	for (const [i, p] of pitchers.entries()) {
		const pFatigue = p.pFatigue ?? 0;
		if ((pFatigue === 0 || (playoffs && pFatigue < 30)) && isHealthy(p)) {
			return p;
		}

		if (i === NUM_STARTING_PITCHERS - 1) {
			break;
		}
	}

	// Second pass - reliever with no fatigue
	for (let i = CLOSER_INDEX + 1; i < pitchers.length; i++) {
		const p = pitchers[i]!;
		const pFatigue = p.pFatigue ?? 0;
		if (pFatigue === 0 && isHealthy(p)) {
			return p;
		}
	}

	// Third pass - look for slightly tired starting pitcher
	for (const [i, p] of pitchers.entries()) {
		const pFatigue = p.pFatigue ?? 0;
		if (pFatigue <= 30 && isHealthy(p)) {
			return p;
		}

		if (i === NUM_STARTING_PITCHERS - 1) {
			break;
		}
	}

	// Fourth pass - tired reliever
	for (let i = CLOSER_INDEX + 1; i < pitchers.length; i++) {
		const p = pitchers[i]!;
		const pFatigue = p.pFatigue ?? 0;
		if (pFatigue <= 30 && isHealthy(p)) {
			return p;
		}
	}

	// Fifth pass - anybody
	let p = random.choice(pitchers.filter((p) => isHealthy(p)));
	if (!p) {
		p = random.choice(pitchers);
	}

	if (!p) {
		throw new Error("Should never happen");
	}

	return p;
};
