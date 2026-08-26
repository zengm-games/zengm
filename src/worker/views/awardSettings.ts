import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import { getAwardCandidates } from "../core/awards/getAwardCandidates.ts";
import { groupByUnique } from "../../common/utils.ts";
import { actualPhase } from "../util/actualPhase.ts";
import { PHASE } from "../../common/constants.ts";
import getPlayoffsByConf from "../core/season/getPlayoffsByConf.ts";
import { defaultAwards } from "../../common/defaultGameAttributes.ts";

const updateAwardSettings = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		// In theory could update on gameSim and playerMovement, but it's actually tricky to keep editing state in sync so save it for later
		updateEvents.includes("firstRun")
	) {
		const season =
			actualPhase() === PHASE.PRESEASON ? g.get("season") - 1 : g.get("season");
		const { awardCandidates, errorMessages } = await getAwardCandidates(
			season,
			g.get("awards"),
		);

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["won", "lost", "tied", "otl"],
				season,
			},
			"noCopyCache",
		);

		const mvp = defaultAwards.mvp;
		const baseNewAward: (typeof awardCandidates)[number][number] = {
			shortName: "NEW",
			name: "New Award",
			formula: mvp.formula,
			showStats: mvp.showStats,
			numTeams: undefined,
			players: [],
			stats: [],
			winner: [],
		};

		return {
			awardCandidates,
			baseNewAward,
			confs: g.get("confs", season),
			divs: g.get("divs", season),
			errorMessages,
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries", season),
			playoffsByConf: await getPlayoffsByConf(season),
			season,
			teams: groupByUnique(teams, "tid"),
		};
	}
};

export default updateAwardSettings;
