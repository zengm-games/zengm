import { idb } from "../db/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { shuffle } from "../../common/random.ts";

const updateFantasyDraft = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
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
};

export default updateFantasyDraft;
