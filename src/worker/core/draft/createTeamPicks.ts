import { g } from "../../util";
import { idb } from "../../db";
import { PHASE } from "../../../common";

const createTeamPicks = async (tid: number) => {
	const dpOffset = g.get("phase") > PHASE.DRAFT ? 1 : 0;
	for (let i = 0; i < g.get("numSeasonsFutureDraftPicks"); i++) {
		const draftYear = g.get("season") + dpOffset + i;

		for (let round = 1; round <= g.get("numDraftRounds"); round++) {
			await idb.cache.draftPicks.put({
				tid: tid,
				originalTid: tid,
				round,
				pick: 0,
				season: draftYear,
			});
		}
	}
};

export default createTeamPicks;
