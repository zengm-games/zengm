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

	// Average together WS and EWA
	const winShares = p.stats.map((ps) => {
		let sum = 0;

		if (typeof ps.dws === "number") {
			sum += ps.dws;
		}

		if (typeof ps.ows === "number") {
			sum += ps.ows;
		}

		if (typeof ps.ewa === "number") {
			sum += ps.ewa;
		}

		if (ps.season < earliestSeason) {
			earliestSeason = ps.season;
		}

		return sum / 2;
	});

	// Calculate career WS and "dominance factor" DF (top 5 years WS - 50)
	winShares.sort((a, b) => b - a); // Descending order

	let total = 0;
	let df = -50;

	for (const [i, winShare] of winShares.entries()) {
		total += winShare;

		if (i < 5) {
			df += winShare;
		}
	}

	// Fudge factor for players generated when the league started
	const fudgeSeasons =
		Math.min(earliestSeason, g.get("startingSeason")) - p.draft.year - 5;

	if (fudgeSeasons > 0 && winShares[0] !== undefined) {
		total += winShares[0] * fudgeSeasons;
	}

	// Final formula
	return (
		total + df >
		120 * helpers.gameAndSeasonLengthScaleFactor() * g.get("hofFactor")
	);
};

export default madeHof;
