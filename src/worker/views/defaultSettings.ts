import type { UpdateEvents } from "../../common/types";
import { getDefaultSettings } from "./newLeague";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun")) {
		const initialSettings = {
			...getDefaultSettings(),
			numActiveTeams: undefined,
		};

		return {
			initialSettings,
		};
	}
};

export default updateOptions;
