import { idb } from "../db";
import type {
	UpdateEvents,
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../common/types";
import { getGlobalSettings } from "../util";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("options")) {
		const options = await getGlobalSettings();

		const realPlayerPhotos = (await idb.meta.get(
			"attributes",
			"realPlayerPhotos",
		)) as RealPlayerPhotos | undefined;

		const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
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
