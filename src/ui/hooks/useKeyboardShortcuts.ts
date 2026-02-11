import { useEffect } from "react";
import helpers from "../util/helpers.ts";
import { TIME_BETWEEN_GAMES } from "../../common/constants.ts";
import { useLocal } from "../util/local.ts";

const IS_APPLE = /Mac|iPhone|iPad|iPod/.test(navigator.platform);

type KeyboardShortcut = Pick<
	KeyboardEvent,
	"altKey" | "ctrlKey" | "metaKey" | "shiftKey" | "key"
>;

export type KeyboardShortcutInfo = {
	name: string;
	customizable: boolean;
	shortcut: KeyboardShortcut;
};

const fastForwardKeys = ["o", "t", "s", "c", "q", "g", "u"] as const;

const fastForwards: Record<
	(typeof fastForwardKeys)[number],
	KeyboardShortcutInfo
> = {} as any;
for (const [i, key] of fastForwardKeys.entries()) {
	fastForwards[key] = {
		name: `Fast forward ${i + 1}`,
		customizable: true,
		shortcut: {
			altKey: true,
			shiftKey: false,
			ctrlKey: false,
			metaKey: IS_APPLE,
			key,
		},
	};
}

export const keyboardShortcuts = {
	boxScore: {
		previous: {
			name: "View previous game",
			customizable: true,
			shortcut: {
				altKey: false,
				shiftKey: false,
				ctrlKey: false,
				metaKey: false,
				key: "ArrowLeft",
			},
		},
		next: {
			name: "View next game",
			customizable: true,
			shortcut: {
				altKey: false,
				shiftKey: false,
				ctrlKey: false,
				metaKey: false,
				key: "ArrowRight",
			},
		},
	},
	playMenu: {
		primary: {
			name: "Primary option",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "p",
			},
		},
		secondary: {
			name: "Secondary option",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "y",
			},
		},
		week: {
			name: "Play one week",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "w",
			},
		},
		month: {
			name: "Play one month",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "m",
			},
		},
		live: {
			name: `Play one ${TIME_BETWEEN_GAMES} (live)`,
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "l",
			},
		},
		allStarGame: {
			name: "Play until All-Star Game",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "a",
			},
		},
		tradeDeadline: {
			name: "Play trade deadline",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "r",
			},
		},
	},
	playPauseNext: {
		playPause: {
			name: "Play/pause",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "b",
			},
		},
		next: {
			name: "Next",
			customizable: true,
			shortcut: {
				altKey: true,
				shiftKey: false,
				ctrlKey: false,
				metaKey: IS_APPLE,
				key: "n",
			},
		},
		...fastForwards,
	},
	commandPallete: {
		open: {
			name: "Open command pallete",
			customizable: true,
			shortcut: {
				altKey: false,
				shiftKey: false,
				ctrlKey: !IS_APPLE,
				metaKey: IS_APPLE,
				key: "k",
			},
		},
		up: {
			name: "",
			customizable: false,
			shortcut: {
				altKey: false,
				shiftKey: false,
				ctrlKey: false,
				metaKey: false,
				key: "ArrowUp",
			},
		},
		down: {
			name: "",
			customizable: false,
			shortcut: {
				altKey: false,
				shiftKey: false,
				ctrlKey: false,
				metaKey: false,
				key: "ArrowDown",
			},
		},
	},
} satisfies Record<string, Record<string, KeyboardShortcutInfo>>;

export type KeyboardShortcuts = typeof keyboardShortcuts;

export type KeyboardShortcutsLocal =
	| {
			[Category in keyof KeyboardShortcuts]?: {
				[Action in keyof KeyboardShortcuts[Category]]?: KeyboardShortcut | null;
			};
	  }
	| undefined;

export type KeyboardShortcutCategories = keyof KeyboardShortcuts;

export const useKeyboardShortcuts = <T extends KeyboardShortcutCategories>(
	category: T,
	actions: ReadonlyArray<keyof KeyboardShortcuts[T]> | undefined,
	callback: (action: keyof KeyboardShortcuts[T]) => void,
) => {
	const keyboardShortcutsLocal = useLocal((state) => state.keyboardShortcuts);

	return useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.isComposing) {
				return;
			}

			// Disable if we are typing in a text field
			const element = event.target;
			if (
				element instanceof HTMLInputElement ||
				element instanceof HTMLTextAreaElement ||
				(element instanceof HTMLElement && element.isContentEditable)
			) {
				return;
			}

			const shortcuts = keyboardShortcuts[category];
			const actualActions = actions ?? helpers.keys(shortcuts);

			const eventKey =
				event.key.length === 1 ? event.key.toLowerCase() : event.key;

			for (const action of actualActions) {
				const shortcutLocal = keyboardShortcutsLocal?.[category]?.[action];
				if (shortcutLocal === null) {
					// Disabled shortcut
					continue;
				}

				const shortcut =
					shortcutLocal ?? (shortcuts[action] as KeyboardShortcutInfo).shortcut;
				if (
					shortcut &&
					event.altKey === shortcut.altKey &&
					event.ctrlKey === shortcut.ctrlKey &&
					event.metaKey === shortcut.metaKey &&
					event.shiftKey === shortcut.shiftKey &&
					eventKey === shortcut.key
				) {
					event.preventDefault();
					callback(action as any);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [callback, category, actions, keyboardShortcutsLocal]);
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

const MODIFIER_KEYS = new Set(["Shift", "Control", "Alt", "Meta"]);

export const formatKeyboardShortcutRaw = (
	shortcut: KeyboardShortcut | null,
) => {
	if (!shortcut) {
		return;
	}

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

	if (!MODIFIER_KEYS.has(shortcut.key)) {
		parts.push(formatKey(shortcut.key));
	}

	return parts.join(IS_APPLE ? "" : "+");
};

export const formatKeyboardShortcut = <T extends KeyboardShortcutCategories>(
	category: T,
	action: keyof KeyboardShortcuts[T],
	keyboardShortcutsLocal: KeyboardShortcutsLocal,
) => {
	let shortcut = keyboardShortcutsLocal?.[category]?.[action];
	if (shortcut === undefined) {
		shortcut = (keyboardShortcuts[category][action] as KeyboardShortcutInfo)
			.shortcut;
	}
	return formatKeyboardShortcutRaw(shortcut);
};
