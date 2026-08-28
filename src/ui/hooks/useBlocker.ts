import { useCallback, useEffect, useState } from "react";
import { router } from "../router/index.ts";
import { confirm } from "../util/confirm.tsx";

export const useBlocker = ({
	message = "If you navigate away from this page, you will lose any unsaved changes.",
	okText = "Navigate away",
	cancelText = "Stay here",
	initialDirty = false,
}: {
	message?: string;
	okText?: string;
	cancelText?: string;
	initialDirty?: boolean;
} = {}) => {
	const [dirty, setDirtyState] = useState(initialDirty);

	const setDirty = useCallback((value: boolean) => {
		setDirtyState(value);

		// Do this here rather than in useEffect that setDirty(false) immediate clears the blocker, so you can immediately navigate away if you want, like in EditAwardWinners.
		// This does mean that setDirty(true) does not immediately set the blocker. I could fix that by setting the block function here, but then setDirty will need to depend on the inputs to that, and I'd rather have setDirty never change. Also currently it just doesn't matter. Like why would I set a blocker and then immediately navigate? I could
		if (!value) {
			router.shouldBlock = undefined;
		}
	}, []);

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
		}
	}, [cancelText, dirty, message, okText]);

	return { dirty, setDirty };
};
