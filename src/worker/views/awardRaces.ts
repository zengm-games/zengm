import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import getAwardCandidates from "../core/awards/getAwardCandidates.ts";
import { groupByUnique } from "../../common/utils.ts";
import { season } from "../core/index.ts";

const updateAwardRaces = async (
	inputs: ViewInput<"awardRaces">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.edit !== state.edit ||
		inputs.season !== state.season
	) {
		const awardCandidates = (await getAwardCandidates(inputs.season)).map(
			(row) => ({
				...row,
				players: addFirstNameShort(row.players),
			}),
		);

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["won", "lost", "tied", "otl"],
				season: inputs.season,
			},
			"noCopyCache",
		);

		return {
			awardCandidates,
			confs: g.get("confs", inputs.season),
			divs: g.get("divs", inputs.season),
			edit: inputs.edit,
			numGamesPlayoffSeries: g.get("numGamesPlayoffSeries", inputs.season),
			playoffsByConf: await season.getPlayoffsByConf(inputs.season),
			season: inputs.season,
			teams: groupByUnique(teams, "tid"),
		};
	}
};

export default updateAwardRaces;
