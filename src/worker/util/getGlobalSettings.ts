import { DEFAULT_PHASE_CHANGE_REDIRECTS } from "../../common/constants.ts";
import { getMetaAttribute } from "../db/metaAttributes.ts";

export const getGlobalSettings = async () => {
	const globalSettings = (await getMetaAttribute("options")) ?? {};

	return {
		...globalSettings,
		phaseChangeRedirects:
			globalSettings.phaseChangeRedirects ?? DEFAULT_PHASE_CHANGE_REDIRECTS,
	};
};
