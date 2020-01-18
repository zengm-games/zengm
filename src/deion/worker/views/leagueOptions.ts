import { g } from "../util";
import { UpdateEvents } from "../../common/types";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes")
	) {
		return {
			autoDeleteOldBoxScores: g.autoDeleteOldBoxScores,
			difficulty: g.difficulty,
			stopOnInjury: g.stopOnInjury,
			stopOnInjuryGames: g.stopOnInjuryGames,
		};
	}
};

export default updateOptions;
