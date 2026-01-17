import { idb } from "../db/index.ts";
import type {
	UpdateEvents,
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../common/types.ts";
import { getGlobalSettings } from "../util/index.ts";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("options")) {
		const options = await getGlobalSettings();

		const attributesStore = (await idb.meta.transaction("attributes")).store;

		const realPlayerPhotos = (await attributesStore.get("realPlayerPhotos")) as
			| RealPlayerPhotos
			| undefined;

		const realTeamInfo = (await attributesStore.get("realTeamInfo")) as
			| RealTeamInfo
			| undefined;

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
