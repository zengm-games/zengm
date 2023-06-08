import { g } from "../../util";
import type { TeamSeason } from "../../../common/types";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";

const getLevelLastThree = <
	Item extends keyof Omit<TeamSeason["expenses"], "salary">,
>(
	teamSeasons: {
		gp: number;
		expenseLevels: Record<Item, number>;
	}[],
	item: Item,
): number => {
	if (g.get("budget")) {
		// Ideally up to 3 seasons would be passed to this form, but in case there's more, this handles it
		const upToLastThreeTeamSeasons = teamSeasons.slice(-3);

		let levelSum = 0;
		let gpSum = 0;
		for (const row of upToLastThreeTeamSeasons) {
			levelSum += row.expenseLevels[item];
			gpSum += row.gp;
		}

		if (gpSum > 0) {
			return Math.round(levelSum / gpSum);
		}
	}

	return DEFAULT_LEVEL;
};

export default getLevelLastThree;
