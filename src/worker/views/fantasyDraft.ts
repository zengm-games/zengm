import { idb } from "../db/index.ts";
import { random } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";

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
		random.shuffle(teams);
		return {
			teams,
		};
	}
};

export default updateFantasyDraft;
