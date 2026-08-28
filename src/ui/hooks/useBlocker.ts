import { useCallback, useEffect, useRef, useState } from "react";
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
	// dirtyRef is so that setDirty(false) immediate clears the blocker, so you can immediately navigate away if you want, like in EditAwardWinners
	const [dirty, setDirtyState] = useState(initialDirty);
	const dirtyRef = useRef(initialDirty);
	const setDirty = useCallback((value: boolean) => {
		dirtyRef.current = value;
		setDirtyState(value);
	}, []);

	useEffect(() => {
		router.shouldBlock = async (refresh) => {
			// refresh check is needed because realtimeUpdate triggers a refresh pageview through the router to trigger updating data, but we never consider that "navigating away" from a page. For example when clicking "Save" on League Settings
			if (refresh || !dirtyRef.current) {
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
	}, [cancelText, message, okText]);

	return { dirty, setDirty };
};
