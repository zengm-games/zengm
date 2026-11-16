import { showNotification } from "./showNotification.ts";

// Returns whether it worked, so the caller can show its own success feedback. Errors are shown here.
export const copyToClipboard = async (text: string) => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		showNotification({
			text: `Error copying to clipboard: ${error.message}`,
			type: "error",
		});
		return false;
	}
};
