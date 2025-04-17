import type { UpdateEvents } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import goatFormula from "../util/goatFormula.ts";
import { getDefaultSettings } from "./newLeague.ts";
import type { Settings } from "./settings.ts";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun")) {
		const overrides = (await idb.meta.get(
			"attributes",
			"defaultSettingsOverrides",
		)) as Partial<Settings> | undefined;

		const defaultSettings = {
			...getDefaultSettings(),
			numActiveTeams: undefined,
			goatFormula: goatFormula.DEFAULT_FORMULA,
			goatFormulaSeason: goatFormula.DEFAULT_FORMULA_SEASON,
		};

		return {
			defaultSettings,
			overrides,
		};
	}
};

export default updateOptions;
