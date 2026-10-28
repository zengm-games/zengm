import { defineView } from "../util/defineView.ts";
import { getMetaAttribute } from "../db/metaAttributes.ts";

export default defineView({
	id: "keyboardShortcuts",
	load: async ({ updateEvents }) => {
		if (updateEvents.has("firstRun")) {
			const keyboardShortcutsLocal =
				await getMetaAttribute("keyboardShortcuts");

			return {
				keyboardShortcutsLocal,
			};
		}
	},
});
