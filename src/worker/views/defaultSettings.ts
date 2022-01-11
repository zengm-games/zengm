import type { UpdateEvents } from "../../common/types";
import { getDefaultSettings } from "./newLeague";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun")) {
		const defaultSettings = {
			...getDefaultSettings(),
			numActiveTeams: undefined,
		};

		return {
			defaultSettings,
		};
	}
};

export default updateOptions;
