import { idb } from "../db";
import type {
	UpdateEvents,
	Options,
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../common/types";

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("options")) {
		const options = ((await idb.meta.get("attributes", "options")) ||
			{}) as unknown as Options;

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
		};
	}
};

export default updateOptions;
