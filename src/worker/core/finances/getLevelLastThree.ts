import { g } from "../../util";
import type { Team, TeamSeasonWithoutKey } from "../../../common/types";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels";
import { PHASE } from "../../../common";
import { idb } from "../../db";

const getLevelLastThree = async (
	key: keyof TeamSeasonWithoutKey["expenseLevels"],

	// We either need to be provided t and teamSeasons, or we need the tid to fetch whatever is missing
	extra:
		| {
				t: Team;
				teamSeasons: TeamSeasonWithoutKey[];
		  }
		| {
				tid: number;
				t?: Team;
				teamSeasons?: TeamSeasonWithoutKey[];
		  },
) => {
	const NUM_SEASONS = 3;

	const teamSeasons =
		extra.teamSeasons ??
		(await idb.cache.teamSeasons.indexGetAll("teamSeasonsByTidSeason", [
			[(extra as any).tid, g.get("season") - 2],
			[(extra as any).tid, g.get("season")],
		]));
	const t = extra.t ?? (await idb.cache.teams.get((extra as any).tid));
	if (!t) {
		throw new Error("Should never happen");
	}

	if (g.get("budget")) {
		// Ideally up to 3 seasons would be passed to this form, but in case there's more, this handles it
		const upToLastThreeTeamSeasons = teamSeasons.slice(-NUM_SEASONS);

		let numSeasonsToImpute = 0;
		let levelSum = 0;
		let gpSum = 0;
		for (const row of upToLastThreeTeamSeasons) {
			if (row.gp === 0 && row.expenseLevels[key] === 0) {
				if (
					g.get("season") === row.season &&
					g.get("phase") > PHASE.REGULAR_SEASON
				) {
					// Could be dummy row, like in real players league with history. Could be a row from the current season when starting a real players league after the regular season. In both cases, we want to impute the spending that would have happened that season
					numSeasonsToImpute += 1;
				}

				// Otherwise, this is probably a season that hadn't started yet, so 0 expense and 0 GP is normal
			} else {
				// Normal case
				levelSum += row.expenseLevels[key];
				gpSum += row.gp;
			}
		}

		// In addition to the blank seasons found above, impute when there are not enough rows passed
		numSeasonsToImpute += NUM_SEASONS - upToLastThreeTeamSeasons.length;

		const numGames = g.get("numGames");

		if (numSeasonsToImpute > 0) {
			levelSum += t.initialBudget[key] * numSeasonsToImpute * numGames;
			gpSum += numSeasonsToImpute * numGames;
		}

		if (gpSum > 0) {
			return Math.round(levelSum / gpSum);
		}
	}

	return DEFAULT_LEVEL;
};

export default getLevelLastThree;
