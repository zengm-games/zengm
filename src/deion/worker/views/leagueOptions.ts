import { g } from "../util";
import { UpdateEvents, Options } from "../../common/types";
import { idb } from "../db";

const updateLeagueOptions = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("options")
	) {
		const options = (((await idb.meta.get("attributes", "options")) ||
			{}) as unknown) as Options;

		return {
			autoDeleteOldBoxScores: g.get("autoDeleteOldBoxScores"),
			difficulty: g.get("difficulty"),
			stopOnInjury: g.get("stopOnInjury"),
			stopOnInjuryGames: g.get("stopOnInjuryGames"),
			globalOptions: {
				units: options.units,
			},
		};
	}
};

export default updateLeagueOptions;
