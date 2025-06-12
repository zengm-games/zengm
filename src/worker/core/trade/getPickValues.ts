import { groupBy, range } from "../../../common/utils.ts";
import { PHASE, PLAYER } from "../../../common/index.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import type { TradePickValues } from "../../../common/types.ts";

const PLACEHOLDER_VALUE_ALREADY_PICKED = -1;

export const getNumPicksPerRound = () => {
	let numPicksPerRound = g.get("numActiveTeams");
	if (g.get("challengeNoDraftPicks")) {
		numPicksPerRound -= 1;
	}

	return numPicksPerRound;
};

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
	const playersByDraftYear = groupBy(players, (p) => p.draft.year);

	const pickValues: TradePickValues = {} as TradePickValues;

	for (const [season, players] of Object.entries(playersByDraftYear)) {
		pickValues[season] = players.map((p) => p.value);
	}

	const currentSeason = g.get("season");

	const numPicksDefault = g.get("numDraftRounds") * getNumPicksPerRound();

	// Handle case where draft is in progress
	if (g.get("phase") === PHASE.DRAFT) {
		const players = await idb.cache.players.indexGetAll("playersByTid", [
			0,
			Infinity,
		]);
		const numDrafted = players.filter(
			(p) => p.draft.year === g.get("season"),
		).length;

		if (numDrafted > 0) {
			// Value of PLACEHOLDER_VALUE_ALREADY_PICKED is arbitrary since these entries should never appear in a trade since the picks don't exist anymore
			const fakeValues = Array(numDrafted).fill(
				PLACEHOLDER_VALUE_ALREADY_PICKED,
			);
			pickValues[currentSeason] = fakeValues.concat(
				pickValues[currentSeason] ?? [],
			);
		}
	}

	// Defaults are the average of future drafts
	const seasons = Object.keys(playersByDraftYear);
	const currentSeasonString = String(currentSeason);
	pickValues.default = range(numPicksDefault).map((i) => {
		const vals = seasons
			.filter((season) => {
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
			.map((season) => pickValues[season]![i]!);
		return vals.reduce((total, val) => total + val, 0) / vals.length;
	});

	return pickValues;
};

export default getPickValues;
