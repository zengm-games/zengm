import { useEffect, useState } from "react";
import router from "../router/index.ts";
import confirm from "../util/confirm.tsx";

export const useBlocker = ({
	message = "Are you sure you want to discard any unsaved changes?",
	okText = "Discard",
	cancelText = "Stay here",
}: {
	message?: string;
	okText?: string;
	cancelText?: string;
} = {}) => {
	const [dirty, setDirty] = useState(false);

	useEffect(() => {
		if (dirty) {
			router.shouldBlock = async (refresh) => {
				// This check is needed because realtimeUpdate triggers a refresh pageview through the router to trigger updating data, but we never consider that "navigating away" from a page. For example when clicking "Save" on League Settings
				if (refresh) {
					return false;
				}

				const proceed = await confirm(message, {
					okText,
					cancelText,
				});

				return !proceed;
			};

			return () => {
				router.shouldBlock = undefined;
			};
		} else {
			router.shouldBlock = undefined;
		}
	}, [cancelText, dirty, message, okText]);

	return { dirty, setDirty };
};
