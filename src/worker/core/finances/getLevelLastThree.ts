import { g } from "../../util";
import type { TeamSeasonWithoutKey } from "../../../common/types";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";

const getLevelLastThree = (
	teamSeasons: TeamSeasonWithoutKey[],
	item: keyof TeamSeasonWithoutKey["expenseLevels"],
): number => {
	const NUM_SEASONS = 3;

	if (g.get("budget")) {
		// Ideally up to 3 seasons would be passed to this form, but in case there's more, this handles it
		const upToLastThreeTeamSeasons = teamSeasons.slice(-NUM_SEASONS);

		let levelSum = 0;
		let gpSum = 0;
		for (const row of upToLastThreeTeamSeasons) {
			levelSum += row.expenseLevels[item];
			gpSum += row.gp;
		}

		// If we have less than three seasons and the first one has firstSeasonBudget, add dummy values
		const numSeasonsMissing = NUM_SEASONS - teamSeasons.length;
		if (numSeasonsMissing > 0) {
			const firstSeason = upToLastThreeTeamSeasons[0];
			if (firstSeason?.firstSeasonBudget) {
				const gp = g.get("numGames");
				levelSum += firstSeason.firstSeasonBudget[item] * gp;
				gpSum += gp;
			}
		}

		if (gpSum > 0) {
			return Math.round(levelSum / gpSum);
		}
	}

	return DEFAULT_LEVEL;
};

export default getLevelLastThree;
