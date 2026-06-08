import { helpers } from "../../util/index.ts";
import { orderBy } from "../../../common/utils.ts";

// Roster-fit multiplier for AI roster building (free agency + draft). Modest,
// tie-breaker strength: rewards filling a team's needs (spacing, position) and
// penalizes piling on redundant ball-dominant players. Never overrides a clear
// talent gap. Kept in sync with the sim's spacer/ball-dominant notions and
// rosterAutoSort's raw-rating spacer definition.

const SPACE_BONUS = 0.03; // per missing spacer (up to ~3)
const BALLDOM_PENALTY = 0.04; // per redundant ball-dominant player
const POS_BONUS = 0.04; // candidate fills/over-fills a position group
const FIT_MIN = 0.88;
const FIT_MAX = 1.12;

const ROTATION_SIZE = 8;
const TARGET_SPACERS = 3;

type PlayerLike = { value?: number; ratings: any[] };

const isSpacer = (r: any) =>
	(r.tp ?? 50) >= 50 && (r.tendencyThree ?? 50) >= 45;
const isBallDominant = (r: any) => (r.tendencyUsage ?? 50) > 65;

const posGroup = (pos: string): "G" | "F" | "C" => {
	if (pos === "C") {
		return "C";
	}
	if (pos.includes("F")) {
		return "F";
	}
	return "G";
};

const rosterFitFactor = (
	rosterPlayers: PlayerLike[],
	candidate: PlayerLike,
): number => {
	if (rosterPlayers.length === 0) {
		return 1;
	}

	const rotation = orderBy(rosterPlayers, (p) => p.value ?? 0, "desc")
		.slice(0, ROTATION_SIZE)
		.map((p) => p.ratings.at(-1));

	let numSpacers = 0;
	let numBallDominant = 0;
	const posCounts: Record<"G" | "F" | "C", number> = { G: 0, F: 0, C: 0 };
	for (const r of rotation) {
		if (isSpacer(r)) {
			numSpacers += 1;
		}
		if (isBallDominant(r)) {
			numBallDominant += 1;
		}
		posCounts[posGroup(r.pos)] += 1;
	}

	const cr = candidate.ratings.at(-1);
	let factor = 1;

	// Spacing: reward a shooter when the rotation lacks spacing.
	if (isSpacer(cr)) {
		factor += SPACE_BONUS * Math.max(0, TARGET_SPACERS - numSpacers);
	}

	// Ball-dominance: penalize adding yet another high-usage player.
	if (isBallDominant(cr) && numBallDominant >= 2) {
		factor -= BALLDOM_PENALTY * (numBallDominant - 1);
	}

	// Position balance: bonus if thin at the candidate's group, penalty if glutted.
	const group = posGroup(cr.pos);
	if (posCounts[group] <= 1) {
		factor += POS_BONUS;
	} else if (posCounts[group] >= 4) {
		factor -= POS_BONUS;
	}

	return helpers.bound(factor, FIT_MIN, FIT_MAX);
};

export default rosterFitFactor;
