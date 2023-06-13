import { g, helpers } from "../../util";
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
	if (g.get("budget")) {
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

		// Ideally up to 3 seasons would be passed to this form, but in case there's more, this handles it
		const upToLastThreeTeamSeasons = teamSeasons.slice(-NUM_SEASONS);

		let numSeasonsToImpute = 0;
		let levelSum = 0;
		let gpSum = 0;
		for (const row of upToLastThreeTeamSeasons) {
			const gp = helpers.getTeamSeasonGp(row);
			if (row.expenseLevels[key] === 0) {
				if (gp === 0) {
					if (
						g.get("season") === row.season &&
						g.get("phase") > PHASE.REGULAR_SEASON
					) {
						// If there are no GP and no expenses, treat as if there is no row at all, unless it's still the preseason or regular season of the current year
						numSeasonsToImpute += 1;
					}
				} else {
					// Could be dummy row, like in real players league with history. Could be a row from the current season when starting a real players league after the regular season. We have GP but no expenses, so impute expenses only.
					levelSum += t.initialBudget[key] * gp;
					gpSum += gp;
				}

				// Otherwise, this is probably a season that hadn't started yet, so 0 expense and 0 GP is normal
			} else {
				// Normal case
				levelSum += row.expenseLevels[key];
				gpSum += gp;
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
