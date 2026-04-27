import { idb } from "../db/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import { getGlobalSettings } from "../util/index.ts";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
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
				realTeamInfo === undefined ? "" : JSON.stringify(realTeamInfo, null, 2),
			units: options.units,
			fullNames: !!options.fullNames,
			phaseChangeRedirects: options.phaseChangeRedirects,
		};
	}
};

export default updateOptions;
