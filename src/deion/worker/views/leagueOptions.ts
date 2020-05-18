import { g } from "../util";
import type { UpdateEvents } from "../../common/types";
import { getOptions } from "./options";

const updateLeagueOptions = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("options")
	) {
		const globalOptions = await getOptions();

		return {
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
			globalOptions,
		};
	}
};

export default updateLeagueOptions;
