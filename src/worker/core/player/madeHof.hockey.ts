import { g, helpers } from "../../util/index.ts";
import type { PlayerWithoutKey } from "../../../common/types.ts";

const madeHof = (p: PlayerWithoutKey): boolean => {
	let earliestSeason = Infinity;

	// Same as MVP formula
	let score = 0;
	let scoreFirstSeason;
	for (const ps of p.stats) {
		const g = (ps.evG ?? 0) + (ps.ppG ?? 0) + (ps.shG ?? 0);
		const a = (ps.evA ?? 0) + (ps.ppA ?? 0) + (ps.shA ?? 0);
		score +=
			(g + a) / 25 + (ps.ops ?? 0) + (ps.dps ?? 0) + 0.775 * (ps.gps ?? 0);
		if (scoreFirstSeason === undefined) {
			scoreFirstSeason = score;
		}

		if (ps.season < earliestSeason) {
			earliestSeason = ps.season;
		}
	}

	if (scoreFirstSeason === undefined) {
		return false;
	}

	// Fudge factor for players generated when the league started
	const fudgeSeasons =
		Math.min(earliestSeason, g.get("startingSeason")) - p.draft.year - 5;

	if (fudgeSeasons > 0) {
		score += scoreFirstSeason * fudgeSeasons;
	}

	// Final formula
	return (
		score > 100 * helpers.gameAndSeasonLengthScaleFactor() * g.get("hofFactor")
	);
};

export default madeHof;
