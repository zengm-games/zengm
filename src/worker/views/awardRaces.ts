import { g } from "../util/index.ts";
import { getAwardCandidates } from "../core/awards/getAwardCandidates.ts";
import { groupByUnique } from "../../common/utils.ts";
import { defineView } from "../util/defineView.ts";
import { validateSeasonOnly } from "../util/processInputs.ts";
import { team } from "../core/index.ts";

export default defineView({
	id: "awardRaces",
	processInputs: validateSeasonOnly,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			(inputs.season === g.get("season") &&
				(updateEvents.has("gameSim") || updateEvents.has("playerMovement"))) ||
			inputs.season !== prevInputs?.season
		) {
			const awardCandidates = (
				await getAwardCandidates(inputs.season)
			).awardCandidates.flat();

			const teams = await team.getFormattedAll({
				attrs: ["tid"],
				seasonAttrs: ["won", "lost", "tied", "otl"],
				season: inputs.season,
			});

			return {
				awardCandidates,
				confs: g.get("confs", inputs.season),
				divs: g.get("divs", inputs.season),
				season: inputs.season,
				teams: groupByUnique(teams, "tid"),
			};
		}
	},
});
