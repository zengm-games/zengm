import { useCallback, useState } from "react";

const IGNORED_ELEMENTS = new Set(["A", "BUTTON", "INPUT", "SELECT"]);

const useClickable = () => {
	const [clicked, setClicked] = useState(false);

	const toggleClicked = useCallback((event: any) => {
		// Purposely using event.target instead of event.currentTarget because we do want check what internal element was clicked on, not the row itself

		// Don't toggle the row if a link was clicked.
		if (event.target.nodeName && IGNORED_ELEMENTS.has(event.target.nodeName)) {
			return;
		}

		if (event.target.dataset?.noRowHighlight) {
			return;
		}

		// This handles modals, where for some reason an event is triggered for any click on or outside the modal, even though the modal is not a child of the actual clickable element (event.currentTarget)
		if (!event.currentTarget.contains(event.target)) {
			return;
		}

		// Search up tree a bit, in case there was like a span inside a button or something
		let currentElement = event.target as HTMLElement | null | undefined;
		for (let i = 0; i < 5; i++) {
			currentElement = currentElement?.parentElement;
			if (!currentElement) {
				break;
			}

			if (currentElement.tagName === "TD" || currentElement.tagName === "TH") {
				break;
			}

			if (IGNORED_ELEMENTS.has(currentElement.tagName)) {
				return;
			}
		}

		setClicked((prevClicked) => !prevClicked);
	}, []);

	return {
		clicked,
		toggleClicked,
	};
};

export default useClickable;
