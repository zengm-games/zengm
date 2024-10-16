import { PHASE } from "../../../common";
import { NUM_STARTING_PITCHERS } from "../../../common/constants.baseball";
import { g, random } from "../../util";
import type { PlayerGameSim } from "./types";

export const CLOSER_INDEX = NUM_STARTING_PITCHERS;

export const getStartingPitcher = (
	pitchers: PlayerGameSim[],
	allStarGame: boolean,
) => {
	if (allStarGame) {
		return pitchers[0];
	}

	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	// First pass - look for starting pitcher with no fatigue
	for (let i = 0; i < pitchers.length; i++) {
		const p = pitchers[i];
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
		const p = pitchers[i];
		const pFatigue = p.pFatigue ?? 0;
		if (pFatigue === 0 && !p.injured) {
			return p;
		}
	}

	// Third pass - look for slightly tired starting pitcher
	for (let i = 0; i < pitchers.length; i++) {
		const p = pitchers[i];
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
		const p = pitchers[i];
		const pFatigue = p.pFatigue ?? 0;
		if (pFatigue <= 30 && !p.injured) {
			return p;
		}
	}

	// Fifth pass - anybody
	let p = random.choice(pitchers.filter(p => !p.injured));
	if (!p) {
		p = random.choice(pitchers);
	}

	if (!p) {
		throw new Error("Should never happen");
	}

	return p;
};
