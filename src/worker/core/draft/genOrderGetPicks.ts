import { idb } from "../../db";
import { g, helpers } from "../../util";
import type { DraftPick } from "../../../common/types";

const genOrderGetPicks = async (mock: boolean) => {
	const draftPicks = helpers.deepCopy(
		await idb.cache.draftPicks.indexGetAll(
			"draftPicksBySeason",
			g.get("season"),
		),
	);

	if (draftPicks.length > 0 || !mock) {
		return draftPicks;
	}

	// If there's no draft picks and this is a mock call, generate mock picks for this season only. This applies for when numSeasonsFutureDraftPicks is 0.

	const mockDraftPicks: DraftPick[] = [];

	const teams = await idb.cache.teams.getAll();

	for (let round = 1; round <= g.get("numDraftRounds"); round++) {
		for (const t of teams) {
			if (t.disabled) {
				continue;
			}

			if (g.get("challengeNoDraftPicks") && g.get("userTids").includes(t.tid)) {
				continue;
			}

			mockDraftPicks.push({
				dpid: -1,
				tid: t.tid,
				originalTid: t.tid,
				round,
				pick: 0,
				season: g.get("season"),
			});
		}
	}

	return mockDraftPicks;
};

export default genOrderGetPicks;
