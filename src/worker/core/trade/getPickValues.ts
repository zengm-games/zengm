import range from "lodash/range";
import { PHASE, PLAYER } from "../../../common";
import { idb } from "../../db";
import { g } from "../../util";
import type { TradePickValues } from "../../../common/types";
import { groupBy } from "lodash";

const PLACEHOLDER_VALUE_ALREADY_PICKED = -1;

/**
 * Estimate draft pick values, based on the generated draft prospects in the database.
 *
 * This was made for team.valueChange, so it could be called once and the results cached.
 *
 * @memberOf core.trade
 * @return {Promise.Object} Resolves to estimated draft pick values.
 */
const getPickValues = async (): Promise<TradePickValues> => {
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.UNDRAFTED,
	);
	players.sort((a, b) => b.value - a.value);
	const playersByDraftYear = groupBy(players, p => p.draft.year);

	const pickValues: TradePickValues = {} as TradePickValues;

	for (const [season, players] of Object.entries(playersByDraftYear)) {
		pickValues[season] = players.map(p => p.value);
	}

	const numPicks = g.get("numDraftRounds") * g.get("numActiveTeams");

	// Handle case where draft is in progress
	if (g.get("phase") === PHASE.DRAFT) {
		// See what the lowest remaining pick is
		const draftPicks = (await idb.cache.draftPicks.getAll()).filter(
			dp => dp.season === g.get("season"),
		);
		const diff = numPicks - draftPicks.length;

		if (diff > 0) {
			// Value of PLACEHOLDER_VALUE_ALREADY_PICKED is arbitrary since these entries should never appear in a trade since the picks don't exist anymore
			const fakeValues = Array(diff).fill(PLACEHOLDER_VALUE_ALREADY_PICKED);
			pickValues[g.get("season")] = fakeValues.concat(
				pickValues[g.get("season")] ?? [],
			);
		}
	}

	// Defaults are the average of future drafts
	const seasons = Object.keys(playersByDraftYear);
	const currentSeasonString = String(g.get("season"));
	pickValues.default = range(numPicks).map(i => {
		const vals = seasons
			.filter(season => {
				const seasonPickValues = pickValues[season];
				if (
					!seasonPickValues ||
					seasonPickValues[i] === undefined ||
					(g.get("phase") === PHASE.DRAFT &&
						season === currentSeasonString &&
						seasonPickValues[i] === PLACEHOLDER_VALUE_ALREADY_PICKED)
				) {
					return false;
				}

				return true;
			})
			.map(season => (pickValues[season] as number[])[i]);
		return vals.reduce((total, val) => total + val, 0) / vals.length;
	});

	return pickValues;
};

export default getPickValues;
