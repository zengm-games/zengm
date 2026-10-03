import { idb } from "../db/index.ts";
import type { KeyboardShortcutsLocal } from "../../ui/util/keyboardShortcuts.ts";
import { defineView } from "../util/defineView.ts";

export default defineView({
	id: "keyboardShortcuts",
	load: async ({ updateEvents }) => {
		if (updateEvents.has("firstRun")) {
			const attributesStore = (await idb.meta.transaction("attributes")).store;

			const keyboardShortcutsLocal = (await attributesStore.get(
				"keyboardShortcuts",
			)) as KeyboardShortcutsLocal | undefined;

			return {
				keyboardShortcutsLocal,
			};
		}
	},
});
