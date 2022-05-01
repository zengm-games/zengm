import { defaultGameAttributes, g, helpers } from "../../util";
import type {
	Player,
	PlayerWithoutKey,
	MinimalPlayerRatings,
} from "../../../common/types";

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

	const wars = p.stats.map(ps => {
		if (ps.season < earliestSeason) {
			earliestSeason = ps.season;
		}

		return ps.war;
	});

	// Calculate career WAR and "dominance factor" DF (top 5 years WAR - 50)
	wars.sort((a, b) => b - a); // Descending order

	let total = 0;
	let df = -30;

	for (let i = 0; i < wars.length; i++) {
		total += wars[i];

		if (i < 5) {
			df += wars[i];
		}
	}

	// Fudge factor for players generated when the league started
	const fudgeSeasons =
		Math.min(earliestSeason, g.get("startingSeason")) - p.draft.year - 5;

	if (fudgeSeasons > 0) {
		total += wars[0] * fudgeSeasons;
	}

	const scaleFactor =
		(helpers.quarterLengthFactor() * g.get("numGames")) /
		defaultGameAttributes.numGames;

	// Final formula
	return total + df > 55 * scaleFactor * g.get("hofFactor");
};

export default madeHof;
