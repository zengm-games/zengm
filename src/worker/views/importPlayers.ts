import { PHASE } from "../../common";
import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateImportPlayers = async (
	input: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON)
	) {
		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			godMode: g.get("godMode"),
			phase: g.get("phase"),
		};
	}
};

export default updateImportPlayers;
