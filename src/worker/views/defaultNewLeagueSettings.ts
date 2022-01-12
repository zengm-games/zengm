import type { UpdateEvents } from "../../common/types";
import { idb } from "../db";
import { getDefaultSettings } from "./newLeague";
import type { Settings } from "./settings";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun")) {
		const overrides = (await idb.meta.get(
			"attributes",
			"defaultSettingsOverrides",
		)) as Settings | undefined;

		const defaultSettings = {
			...getDefaultSettings(),
			numActiveTeams: undefined,
		};

		return {
			defaultSettings,
			overrides,
		};
	}
};

export default updateOptions;
