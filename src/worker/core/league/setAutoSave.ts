import { idb } from "../../db/index.ts";
import { g, local } from "../../util/index.ts";
import updateMeta from "./updateMeta.ts";

export const setAutoSave = async (autoSave: boolean) => {
	if (!autoSave) {
		await idb.cache.flush();
	}

	local.autoSave = autoSave;

	if (autoSave) {
		await idb.cache.flush();
		await idb.cache.fill();

		// Changes made with auto save disabled were not written to meta, so do that now
		await updateMeta({
			phaseText: local.phaseText,
			difficulty: g.get("difficulty"),
		});
	}
};
