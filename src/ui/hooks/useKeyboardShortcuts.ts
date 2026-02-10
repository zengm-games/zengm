import { useEffect } from "react";
import helpers from "../util/helpers.ts";
import { TIME_BETWEEN_GAMES } from "../../common/constants.ts";

const IS_APPLE = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

type KeyboardShortcut = { name: string; customizable: boolean } & Pick<
	KeyboardEvent,
	"altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "key"
>;

const fastForwardKeys = ["o", "t", "s", "c", "q", "g", "u"] as const;

const fastForwards: Record<(typeof fastForwardKeys)[number], KeyboardShortcut> =
	{} as any;
for (const [i, key] of fastForwardKeys.entries()) {
	fastForwards[key] = {
		name: `Fast forward ${i + 1}`,
		customizable: true,
		altKey: true,
		shiftKey: false,
		ctrlKey: false,
		metaKey: IS_APPLE,
		key,
	};
}

const keyboardShortcuts = {
	boxScore: {
		previous: {
			name: "View previous game",
			customizable: true,
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			key: "ArrowLeft",
		},
		next: {
			name: "View next game",
			customizable: true,
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			key: "ArrowRight",
		},
	},
	playMenu: {
		primary: {
			name: "Primary option",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "p",
		},
		secondary: {
			name: "Secondary option",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "y",
		},
		week: {
			name: "Play one week",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "w",
		},
		month: {
			name: "Play one month",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "m",
		},
		live: {
			name: `Play one ${TIME_BETWEEN_GAMES} (live)`,
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "l",
		},
		allStarGame: {
			name: "Play one month",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "a",
		},
		tradeDeadline: {
			name: "Play one month",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "r",
		},
		stop: {
			name: "Stop",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "s",
		},
	},
	playPauseNext: {
		playPause: {
			name: "Play/pause",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "b",
		},
		next: {
			name: "Next",
			customizable: true,
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key: "n",
		},
		...fastForwards,
	},
	commandPallete: {
		open: {
			name: "Open command pallete",
			customizable: true,
			altKey: false,
			shiftKey: false,
			ctrlKey: !IS_APPLE,
			metaKey: IS_APPLE,
			key: "k",
		},
		up: {
			name: "",
			customizable: false,
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			key: "ArrowUp",
		},
		down: {
			name: "",
			customizable: false,
			altKey: false,
			shiftKey: false,
			ctrlKey: false,
			metaKey: false,
			key: "ArrowDown",
		},
	},
} satisfies Record<string, Record<string, KeyboardShortcut>>;

export type KeyboardShortcuts = typeof keyboardShortcuts;

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

const formatKey = (key: string) => {
	const SPECIAL_KEYS: Record<string, string> = {
		ArrowLeft: "←",
		ArrowRight: "→",
		ArrowUp: "↑",
		ArrowDown: "↓",
		Enter: "Enter",
		Escape: "Esc",
		Backspace: "⌫",
		Delete: "Del",
		Tab: "Tab",
		" ": "Space",
	};

	if (SPECIAL_KEYS[key]) {
		return SPECIAL_KEYS[key];
	}

	if (key.length === 1) {
		return key.toUpperCase();
	}

	return key;
};

export const formatKeyboardShortcut = <T extends KeyboardShortcutCategories>(
	category: T,
	id: keyof KeyboardShortcuts[T],
) => {
	const shortcut = keyboardShortcuts[category][id] as KeyboardShortcut;

	const parts: string[] = [];

	if (IS_APPLE) {
		if (shortcut.ctrlKey) {
			parts.push("⌃");
		}
		if (shortcut.altKey) {
			parts.push("⌥");
		}
		if (shortcut.shiftKey) {
			parts.push("⇧");
		}
		if (shortcut.metaKey) {
			parts.push("⌘");
		}
	} else {
		if (shortcut.ctrlKey) {
			parts.push("Ctrl");
		}
		if (shortcut.altKey) {
			parts.push("Alt");
		}
		if (shortcut.shiftKey) {
			parts.push("Shift");
		}
		if (shortcut.metaKey) {
			parts.push("Win");
		}
	}

	parts.push(formatKey(shortcut.key));

	return parts.join(IS_APPLE ? "" : "+");
};
