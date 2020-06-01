import type { Player, PlayerWithoutKey } from "../../../common/types";
import { POSITION_COUNTS } from "../../../common";

const getNeededPositions = (players: Player[] | PlayerWithoutKey[]) => {
	const neededPositions = new Set<string>();

	if (Object.keys(POSITION_COUNTS).length === 0) {
		return neededPositions;
	}

	const counts = { ...POSITION_COUNTS };

	for (const p of players) {
		const pos = p.ratings[p.ratings.length - 1].pos;

		if (counts.hasOwnProperty(pos)) {
			counts[pos] -= 1;
		}
	}

	// Special case - if there are some positions where 0 players are on roster, put those first with some probability. This ensures K/P is always on team.
	if (Math.random() < 0.25) {
		for (const [pos, numNeeded] of Object.entries(counts)) {
			if (numNeeded === POSITION_COUNTS[pos]) {
				neededPositions.add(pos);
			}
		}

		if (neededPositions.size > 0) {
			return neededPositions;
		}
	}

	for (const [pos, numNeeded] of Object.entries(counts)) {
		if (numNeeded > 0) {
			neededPositions.add(pos);
		}
	}

	return neededPositions;
};

export default getNeededPositions;
