import { g } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateLeagueOptions = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("options")
	) {
		return {
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
		};
	}
};

export default updateLeagueOptions;
