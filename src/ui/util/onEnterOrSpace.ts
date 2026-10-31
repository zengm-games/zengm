import type { KeyboardEvent } from "react";

// For elements that can't be a <button> but act like one, so they can be activated from the keyboard like a button
export const onEnterOrSpace =
	(callback: (event: KeyboardEvent) => void) => (event: KeyboardEvent) => {
		if (event.key === "Enter" || event.key === " ") {
			event.preventDefault();
			callback(event);
		}
	};
