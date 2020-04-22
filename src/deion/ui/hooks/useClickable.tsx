import { useCallback, useState } from "react";

const useClickable = () => {
	const [clicked, setClicked] = useState(false);
	const toggleClicked = useCallback((event: any) => {
		// Purposely using event.target instead of event.currentTarget because we do want check what internal element was clicked on, not the row itself
		// Don't toggle the row if a link was clicked.
		const ignoredElements = ["A", "BUTTON", "INPUT", "SELECT"];

		if (
			event.target.nodeName &&
			ignoredElements.includes(event.target.nodeName)
		) {
			return;
		}

		if (event.target.dataset && event.target.dataset.noRowHighlight) {
			return;
		}

		// This handles modals, where for some reason an event is triggered for any click on or outside the modal, even though the modal is not a child of the actual clickable element (event.currentTarget)
		if (!event.currentTarget.contains(event.target)) {
			return;
		}

		setClicked(prevClicked => !prevClicked);
	}, []);
	return {
		clicked,
		toggleClicked,
	};
};

export default useClickable;
