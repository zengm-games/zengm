import { DEFAULT_CONFS } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import goatFormula from "../util/goatFormula.ts";
import { getDefaultSettings } from "./newLeague.ts";
import type { Settings } from "./settings.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "defaultNewLeagueSettings",
	load: async ({ updateEvents }) => {
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
				confs: DEFAULT_CONFS,
			};

			return {
				defaultSettings,
				overrides,
			};
		}
	},
});
