import { useEffect } from "react";

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
	"Play menue": {},
	"Play/pause/next": {},
	"Command Palette": {},
} satisfies Record<string, Record<string, KeyboardShortcut>>;

type KeyboardShortcuts = typeof keyboardShortcuts;

type KeyboardShortcutCategories = keyof KeyboardShortcuts;

export const useKeyboardShortcuts = <T extends KeyboardShortcutCategories>(
	category: T,
	callback: (key: keyof KeyboardShortcuts[T]) => void,
) => {
	return useEffect(() => {
		const handleKeydown = (event: KeyboardEvent) => {
			if (event.isComposing) {
				return;
			}

			for (const [key, shortcut] of Object.entries(
				keyboardShortcuts[category],
			)) {
				if (
					event.altKey === shortcut.altKey &&
					event.ctrlKey === shortcut.ctrlKey &&
					event.metaKey === shortcut.metaKey &&
					event.shiftKey === shortcut.shiftKey &&
					event.code === shortcut.code
				) {
					callback(key as any);
					break;
				}
			}
		};

		document.addEventListener("keydown", handleKeydown);
		return () => {
			document.removeEventListener("keydown", handleKeydown);
		};
	}, [category, callback]);
};
