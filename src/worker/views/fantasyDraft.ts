import { shuffle } from "../../common/random.ts";
import { defineView } from "../util/defineView.ts";
import { PHASE } from "../../common/constants.ts";
import { g } from "../util/index.ts";
import { helpers } from "../util/index.ts";
import { team } from "../core/index.ts";

const processInputs = () => {
	if (g.get("phase") === PHASE.FANTASY_DRAFT) {
		return {
			redirectUrl: helpers.leagueUrl(["draft"]),
		};
	}
};

export default defineView({
	id: "fantasyDraft",
	processInputs,
	load: async ({ updateEvents }) => {
		if (updateEvents.has("firstRun")) {
			const teams = await team.getFormattedAll({
				attrs: ["tid", "abbrev", "region", "name"],
				active: true,
			});
			shuffle(teams);
			return {
				teams,
			};
		}
	},
});
