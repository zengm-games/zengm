import { PLAYER } from "../../../common/index.ts";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerWithoutKey,
} from "../../../common/types.ts";

/**
 * Adds player to the free agents list.
 *
 * This should be THE ONLY way that players are added to the free agents
 * list, because this will also calculate their demanded contract and mood.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 */
const addToFreeAgents = async (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
	numPlayersTradedAwayNormalized: Record<number, number>,
) => {
	p.tid = PLAYER.FREE_AGENT;
	p.numDaysFreeAgent = 0;
	p.ptModifier = 1;

	// Extra check is for console scripts from before numPlayersTradedAwayNormalized was a required parameter
	// Spread is because addToFreeAgents is often called in a loop, with numPlayersTradedAwayNormalized calculated once up front
	p.numPlayersTradedAwayNormalized = numPlayersTradedAwayNormalized
		? { ...numPlayersTradedAwayNormalized }
		: undefined;
};

export default addToFreeAgents;
