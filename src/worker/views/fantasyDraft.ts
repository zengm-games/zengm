import { idb } from "../db";
import { g, random } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateFantasyDraft = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun")) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name"],
			active: true,
		});
		random.shuffle(teams);
		return {
			phase: g.get("phase"),
			teams,
			userTids: g.get("userTids"),
		};
	}
};

export default updateFantasyDraft;
