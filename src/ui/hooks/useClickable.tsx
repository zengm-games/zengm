import { useCallback, useState, type MouseEvent } from "react";

const IGNORED_ELEMENTS_SELECTOR = [
	"A",
	"BUTTON",
	"INPUT",
	"SELECT",
	"TEXTAREA",

	// data-no-row-highlight is a hack and ideally would be removed
	"[data-no-row-highlight]",
].join(",");

const useClickable = () => {
	const [clicked, setClicked] = useState(false);

	const toggleClicked = useCallback(
		(event: MouseEvent<HTMLTableRowElement>) => {
			// Purposely using event.target instead of event.currentTarget because we do want check what internal element was clicked on, not the row itself

			// I think this is not actually needed, just for TypeScript
			const target = event.target;
			if (!(target instanceof Element)) {
				return;
			}

			// This handles modals, where for some reason an event is triggered for any click on or outside the modal, even though the modal is not a child of the actual clickable element (event.currentTarget)
			if (!event.currentTarget.contains(target)) {
				return;
			}

			// Don't toggle the row if a link/button/etc was clicked. closest checks the target itself and its ancestors, in case there was like a span inside a button or something
			if (target.closest(IGNORED_ELEMENTS_SELECTOR)) {
				return;
			}

			setClicked((prevClicked) => !prevClicked);
		},
		[],
	);

	return {
		clicked,
		toggleClicked,
	};
};

export default useClickable;
