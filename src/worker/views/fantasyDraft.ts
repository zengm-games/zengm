import { idb } from "../db/index.ts";
import { shuffle } from "../../common/random.ts";
import { defineView } from "../util/defineView.ts";
import { PHASE } from "../../common/constants.ts";
import { g } from "../util/index.ts";
import { helpers } from "../util/index.ts";

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
		if (updateEvents.includes("firstRun")) {
			const teams = await idb.getCopies.teamsPlus(
				{
					attrs: ["tid", "abbrev", "region", "name"],
					active: true,
				},
				"noCopyCache",
			);
			shuffle(teams);
			return {
				teams,
			};
		}
	},
});
