import { idb } from "../db/index.ts";
import type { UpdateEvents } from "../../common/types.ts";
import type { KeyboardShortcutsLocal } from "../../ui/hooks/useKeyboardShortcuts.ts";

const updateKeyboardShortcuts = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun")) {
		const attributesStore = (await idb.meta.transaction("attributes")).store;

		const keyboardShortcutsLocal = (await attributesStore.get(
			"keyboardShortcuts",
		)) as KeyboardShortcutsLocal | undefined;

		return {
			keyboardShortcutsLocal,
		};
	}
};

export default updateKeyboardShortcuts;
