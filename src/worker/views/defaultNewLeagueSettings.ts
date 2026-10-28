import { DEFAULT_CONFS } from "../../common/constants.ts";
import goatFormula from "../util/goatFormula.ts";
import { getDefaultSettings } from "./newLeague.ts";
import { defineView } from "../util/defineView.ts";
import { getMetaAttribute } from "../db/metaAttributes.ts";

export default defineView({
	id: "defaultNewLeagueSettings",
	load: async ({ updateEvents }) => {
		if (updateEvents.has("firstRun")) {
			const overrides = await getMetaAttribute("defaultSettingsOverrides");

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
