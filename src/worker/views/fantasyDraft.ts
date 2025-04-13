import { idb } from "../db/index.ts";
import { g, random } from "../util/index.ts";
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
			phase: g.get("phase"),
			teams,
			userTids: g.get("userTids"),
		};
	}
};

export default updateFantasyDraft;
