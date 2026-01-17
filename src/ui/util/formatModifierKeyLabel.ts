export const formatModifierKeyLabel = (key: string) => {
	const isMac = navigator.platform?.toLowerCase().startsWith("mac");

	if (isMac) {
		return `⌥ ${key}`;
	} else {
		return `Alt+${key}`;
	}
};
