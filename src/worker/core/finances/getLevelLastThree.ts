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

		// If we have less than three seasons and the first one has firstSeasonBudget, add dummy values. This is not necessarily the first entry in  upToLastThreeTeamSeasons! Imagine a real players league started with full history. There will be dummy TeamSeason entries with no expenseLevels in them, and firstSeasonBudget will be in the latest season. It needs to override those dummy entries.
		const firstSeasonIndex = upToLastThreeTeamSeasons.findIndex(
			row => row.firstSeasonBudget,
		);
		const firstSeason = upToLastThreeTeamSeasons[firstSeasonIndex];
		if (firstSeason?.firstSeasonBudget) {
			const gp = g.get("numGames");

			// Handle leagues started after regular season
			if (firstSeason.gp === 0) {
				gpSum = gp;
			}
			if (firstSeason.expenseLevels[item] === 0) {
				levelSum += firstSeason.firstSeasonBudget[item] * gp;
			}

			// Handle any seasons from before the league existed
			const numFullSeasonsMissing = firstSeasonIndex;
			if (numFullSeasonsMissing > 0) {
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
