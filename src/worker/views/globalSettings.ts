import { idb } from "../db/index.ts";
import { getGlobalSettings } from "../util/getGlobalSettings.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "globalSettings",
	load: async ({ updateEvents }) => {
		if (updateEvents.includes("firstRun") || updateEvents.includes("options")) {
			const options = await getGlobalSettings();

			const attributesStore = (await idb.meta.transaction("attributes")).store;

			// Don't assume these have the correct type, because even if they are invalid, we still should let the user edit
			const realPlayerPhotos: unknown =
				await attributesStore.get("realPlayerPhotos");
			const realTeamInfo: unknown = await attributesStore.get("realTeamInfo");

			return {
				realPlayerPhotos:
					realPlayerPhotos === undefined
						? ""
						: JSON.stringify(realPlayerPhotos, null, 2),
				realTeamInfo:
					realTeamInfo === undefined
						? ""
						: JSON.stringify(realTeamInfo, null, 2),
				units: options.units,
				fullNames: !!options.fullNames,
				phaseChangeRedirects: options.phaseChangeRedirects,
			};
		}
	},
});
