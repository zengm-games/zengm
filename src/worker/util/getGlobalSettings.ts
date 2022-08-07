import { idb } from "../db";
import type { Options } from "../../common/types";
import { DEFAULT_PHASE_CHANGE_REDIRECTS } from "../../common";

const getGlobalSettings = async () => {
	const globalSettings = ((await idb.meta.get("attributes", "options")) ??
		{}) as unknown as Options;

	if (globalSettings.phaseChangeRedirects === undefined) {
		globalSettings.phaseChangeRedirects = DEFAULT_PHASE_CHANGE_REDIRECTS;
	}

	return globalSettings;
};

export default getGlobalSettings;
