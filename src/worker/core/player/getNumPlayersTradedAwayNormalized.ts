import type { TeamSeason } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import g from "../../util/g.ts";

export const getNumPlayersTradedAwayNormalized = (
	teamSeasons: TeamSeason[],
	season: number,
) => {
	let numPlayersTradedAwayNormalized = 0;
	for (const teamSeason of teamSeasons) {
		if (teamSeason.season === season - 2) {
			numPlayersTradedAwayNormalized += teamSeason.numPlayersTradedAway * 0.25;
		} else if (teamSeason.season === season - 1) {
			numPlayersTradedAwayNormalized += teamSeason.numPlayersTradedAway * 0.5;
		} else if (teamSeason.season === season) {
			numPlayersTradedAwayNormalized += teamSeason.numPlayersTradedAway * 0.75;
		}
	}

	return numPlayersTradedAwayNormalized;
};

export const getNumPlayersTradedAwayNormalizedAll = async () => {
	const season = g.get("season");
	const numPlayersTradedAwayNormalized: Record<number, number> = {};

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsBySeasonTid",
		[[season - 2], [season, "Z"]],
	);
	const teamSeasonsByTid = Object.groupBy(teamSeasons, (row) => row.tid);

	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		if (t.disabled) {
			continue;
		}

		numPlayersTradedAwayNormalized[t.tid] = getNumPlayersTradedAwayNormalized(
			teamSeasonsByTid[t.tid] ?? [],
			season,
		);
	}

	return numPlayersTradedAwayNormalized;
};
