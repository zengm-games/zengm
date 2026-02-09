import { useEffect } from "react";
import helpers from "../util/helpers.ts";

const IS_APPLE = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

type KeyboardShortcut = { name: string } & Pick<
	KeyboardEvent,
	"altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "key"
>;

const keyboardShortcuts = {
	boxScore: {
		previous: {
			name: "View previous game",
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			key: "ArrowLeft",
		},
		next: {
			name: "View next game",
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			key: "ArrowRight",
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
			key: "k",
		},
	},
} satisfies Record<string, Record<string, KeyboardShortcut>>;

type KeyboardShortcuts = typeof keyboardShortcuts;

type KeyboardShortcutCategories = keyof KeyboardShortcuts;

const normalizeKey = (key: string) => {
	// Ignore pure modifiers
	if (
		key === "Shift" ||
		key === "Control" ||
		key === "Alt" ||
		key === "Meta" ||
		key === "CapsLock" ||
		key === "Fn"
	) {
		return;
	}

	// Dead keys (macOS / intl layouts)
	if (key === "Dead") {
		return;
	}

	// Legacy / cross-browser normalization
	if (key === "Esc") {
		return "Escape";
	}
	if (key === "Spacebar") {
		return " ";
	}
	if (key === "Left") {
		return "ArrowLeft";
	}
	if (key === "Right") {
		return "ArrowRight";
	}
	if (key === "Up") {
		return "ArrowUp";
	}
	if (key === "Down") {
		return "ArrowDown";
	}

	// Normalize printable characters
	if (key.length === 1) {
		return key.toLowerCase();
	}

	return key;
};

export const useKeyboardShortcuts = <T extends KeyboardShortcutCategories>(
	category: T,
	ids: ReadonlyArray<keyof KeyboardShortcuts[T]> | undefined,
	callback: (id: keyof KeyboardShortcuts[T], event: KeyboardEvent) => void,
) => {
	return useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.isComposing) {
				return;
			}

			const actualIds = ids ?? helpers.keys(keyboardShortcuts[category]);
			const shortcuts = keyboardShortcuts[category];

			const eventKey = normalizeKey(event.key);

			for (const id of actualIds) {
				const shortcut = shortcuts[id] as KeyboardShortcut;
				if (
					event.altKey === shortcut.altKey &&
					event.ctrlKey === shortcut.ctrlKey &&
					event.metaKey === shortcut.metaKey &&
					event.shiftKey === shortcut.shiftKey &&
					eventKey === shortcut.key
				) {
					callback(id as any, event);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [callback, category, ids]);
};
