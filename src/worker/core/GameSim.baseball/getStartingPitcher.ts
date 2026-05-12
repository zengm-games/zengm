import { PHASE } from "../../../common/constants.ts";
import { NUM_STARTING_PITCHERS } from "../../../common/constants.baseball.ts";
import { g } from "../../util/index.ts";
import { choice } from "../../../common/random.ts";

export const CLOSER_INDEX = NUM_STARTING_PITCHERS;

export const getStartingPitcher = <
	T extends {
		injured: boolean;
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
		if ((pFatigue === 0 || (playoffs && pFatigue < 30)) && !p.injured) {
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
		if (pFatigue === 0 && !p.injured) {
			return p;
		}
	}

	// Third pass - look for slightly tired starting pitcher
	for (const [i, p] of pitchers.entries()) {
		const pFatigue = p.pFatigue ?? 0;
		if (pFatigue <= 30 && !p.injured) {
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
		if (pFatigue <= 30 && !p.injured) {
			return p;
		}
	}

	// Fifth pass - anybody
	let p = choice(pitchers.filter((p) => !p.injured));
	if (!p) {
		p = choice(pitchers);
	}

	if (!p) {
		throw new Error("Should never happen");
	}

	return p;
};
