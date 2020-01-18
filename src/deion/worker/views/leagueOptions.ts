import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
		};
	}
};

export default updateOptions;
