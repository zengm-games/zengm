// @flow

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

		setClicked(prevClicked => !prevClicked);
	}, []);

	return {
		clicked,
		toggleClicked,
	};
};

export default useClickable;
