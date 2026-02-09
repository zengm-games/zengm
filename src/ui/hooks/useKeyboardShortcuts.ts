import { useEffect } from "react";
import helpers from "../util/helpers.ts";

const IS_APPLE = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

type KeyboardShortcut = { name: string } & Pick<
	KeyboardEvent,
	"altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "code"
>;

const keyboardShortcuts = {
	boxScore: {
		previous: {
			name: "View previous game",
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			code: "ArrowLeft",
		},
		next: {
			name: "View next game",
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			code: "ArrowRight",
		},
	},
	playMenu: {},
	playPauseNext: {},
	commandPallete: {
		open: {
			name: "Open command pallete",
			altKey: false,
			shiftKey: false,
			ctrlKey: !IS_APPLE,
			metaKey: IS_APPLE,
			code: "KeyK",
		},
	},
} satisfies Record<string, Record<string, KeyboardShortcut>>;

type KeyboardShortcuts = typeof keyboardShortcuts;

type KeyboardShortcutCategories = keyof KeyboardShortcuts;

export const useKeyboardShortcuts = <T extends KeyboardShortcutCategories>(
	category: T,
	keys: ReadonlyArray<keyof KeyboardShortcuts[T]> | undefined,
	callback: (key: keyof KeyboardShortcuts[T], event: KeyboardEvent) => void,
) => {
	return useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.isComposing) {
				return;
			}

			const actualKeys = keys ?? helpers.keys(keyboardShortcuts[category]);
			const shortcuts = keyboardShortcuts[category];

			for (const key of actualKeys) {
				const shortcut = shortcuts[key] as KeyboardShortcut;
				if (
					event.altKey === shortcut.altKey &&
					event.ctrlKey === shortcut.ctrlKey &&
					event.metaKey === shortcut.metaKey &&
					event.shiftKey === shortcut.shiftKey &&
					event.code === shortcut.code
				) {
					callback(key as any, event);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [callback, category, keys]);
};
