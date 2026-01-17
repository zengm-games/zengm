import { g, helpers } from "../../util/index.ts";
import type {
	Player,
	PlayerWithoutKey,
	MinimalPlayerRatings,
} from "../../../common/types.ts";

/**
 * Is a player worthy of the Hall of Fame?
 *
 * This calculation is based on http://espn.go.com/nba/story/_/id/8736873/nba-experts-rebuild-springfield-hall-fame-espn-magazine except it includes each playoff run as a separate season.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @return {boolean} Hall of Fame worthy?
 */
const madeHof = (
	p: Player<MinimalPlayerRatings> | PlayerWithoutKey<MinimalPlayerRatings>,
): boolean => {
	let earliestSeason = Infinity;

	const wars: number[] = p.stats.map((ps) => {
		if (ps.season < earliestSeason) {
			earliestSeason = ps.season;
		}

		return ps.war;
	});

	// Calculate career WAR and "dominance factor" DF (top 5 years WAR - 50)
	wars.sort((a, b) => b - a); // Descending order

	let total = 0;
	let df = -30;

	for (const [i, war] of wars.entries()) {
		total += war;

		if (i < 5) {
			df += war;
		}
	}

	// Fudge factor for players generated when the league started
	const fudgeSeasons =
		Math.min(earliestSeason, g.get("startingSeason")) - p.draft.year - 5;

	if (fudgeSeasons > 0 && wars[0] !== undefined) {
		total += wars[0] * fudgeSeasons;
	}

	// Final formula
	return (
		total + df >
		55 * helpers.gameAndSeasonLengthScaleFactor() * g.get("hofFactor")
	);
};

export default madeHof;
