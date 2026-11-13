import { showNotification } from "./showNotification.ts";

// Run an action that calls the worker while a busy flag is set. If the action throws, the error is shown to the user and the flag is cleared, so a button can't stay stuck. Returns true if the action succeeded.
export const runAction = async (
	setProcessing: (processing: boolean) => void,
	action: () => Promise<unknown>,

	// Keep the flag set after success, for actions that end by navigating to another page, so the button can't be clicked again before that happens
	{
		keepProcessingOnSuccess = false,
	}: { keepProcessingOnSuccess?: boolean } = {},
) => {
	setProcessing(true);

	try {
		await action();
	} catch (error) {
		showNotification({
			type: "error",
			text: error.message,
		});
		setProcessing(false);
		return false;
	}

	if (!keepProcessingOnSuccess) {
		setProcessing(false);
	}
	return true;
};
