import { idb } from "../db";
import type {
	UpdateEvents,
	Options,
	RealPlayerPhotos,
	RealTeamInfo,
} from "../../common/types";

export const getOptions = async () => {
	const options = (((await idb.meta.get("attributes", "options")) ||
		{}) as unknown) as Options;

	const realPlayerPhotos = (await idb.meta.get(
		"attributes",
		"realPlayerPhotos",
	)) as RealPlayerPhotos | undefined;

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;

	return {
		realPlayerPhotos:
			realPlayerPhotos === undefined ? "" : JSON.stringify(realPlayerPhotos),
		realTeamInfo:
			realTeamInfo === undefined ? "" : JSON.stringify(realTeamInfo),
		units: options.units,
	};
};

const updateOptions = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("options")) {
		return getOptions();
	}
};

export default updateOptions;
