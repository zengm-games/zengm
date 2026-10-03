import { idb } from "../db/index.ts";
import { shuffle } from "../../common/random.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("fantasyDraft", async ({ updateEvents }) => {
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
});
