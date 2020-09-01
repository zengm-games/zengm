import { finances } from "..";
import { g, helpers, random } from "../../util";
import type { TeamSeasonWithoutKey } from "../../../common/types";

const genBaseMood = (
	teamSeason: TeamSeasonWithoutKey,
	reSigning: boolean,
): number => {
	// Special case for winning a title - basically never refuse to re-sign unless a miracle occurs
	if (
		teamSeason.playoffRoundsWon ===
			g.get("numGamesPlayoffSeries", "current").length &&
		Math.random() < 0.99
	) {
		return -0.25; // Should guarantee no refusing to re-sign
	}

	let baseMood = 0;

	// Hype
	baseMood += 0.5 * (1 - teamSeason.hype);

	// Facilities - fuck it, just use most recent rank
	baseMood +=
		(0.1 *
			(finances.getRankLastThree([teamSeason], "expenses", "facilities") - 1)) /
		(g.get("numActiveTeams") - 1); // Population

	baseMood += 0.2 * (1 - teamSeason.pop / 10);

	// Randomness
	baseMood += random.uniform(-0.2, 0.4);

	baseMood = helpers.bound(baseMood, 0, 1.2);

	// Difficulty
	if (g.get("userTids").includes(teamSeason.tid)) {
		baseMood += g.get("difficulty");
	}

	// Don't let difficulty have too crazy of an impact, for re-signing at least
	if (reSigning) {
		baseMood = helpers.bound(baseMood, 0, 1.5);
	} else if (g.get("difficulty") > 0) {
		baseMood = helpers.bound(baseMood, 0, 1.5 + g.get("difficulty"));
	}

	return baseMood;
};

export default genBaseMood;
