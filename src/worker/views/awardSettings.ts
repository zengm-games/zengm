import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import { getAwardCandidates } from "../core/awards/getAwardCandidates.ts";
import { groupByUnique } from "../../common/utils.ts";
import { actualPhase } from "../util/actualPhase.ts";
import { PHASE } from "../../common/constants.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";

const updateAwardSettings = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement")
	) {
		const season =
			actualPhase() === PHASE.PRESEASON ? g.get("season") - 1 : g.get("season");
		const awardCandidates = await getAwardCandidates(season);

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["won", "lost", "tied", "otl"],
				season,
			},
			"noCopyCache",
		);

		return {
			awardCandidates,
			confs: g.get("confs", season),
			divs: g.get("divs", season),
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries", season),
			playoffsByConf: await getPlayoffsByConf(season),
			season,
			teams: groupByUnique(teams, "tid"),
		};
	}
};

export default updateAwardSettings;
