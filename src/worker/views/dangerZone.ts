import { local } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";

export default defineView("dangerZone", () => {
	return {
		autoSave: local.autoSave,
	};
});
