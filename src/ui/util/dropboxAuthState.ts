const STORAGE_KEY = "dropboxAuthState";

type SavedState = {
	state: string;
	lid: number;
};

const isSavedState = (value: unknown): value is SavedState => {
	return (
		typeof value === "object" &&
		value !== null &&
		"state" in value &&
		typeof value.state === "string" &&
		"lid" in value &&
		typeof value.lid === "number"
	);
};

// Call right before redirecting to Dropbox. Returns the value to send as the OAuth "state" parameter.
export const createDropboxAuthState = (lid: number) => {
	const state = crypto.randomUUID();
	const saved: SavedState = { state, lid };
	sessionStorage.setItem(STORAGE_KEY, JSON.stringify(saved));
	return state;
};

// Call when Dropbox redirects back. Returns the lid of the league that started the authorization, or undefined if this tab did not start one with this state. Each state can only be used once.
export const consumeDropboxAuthState = (state: string | null) => {
	const json = sessionStorage.getItem(STORAGE_KEY);
	sessionStorage.removeItem(STORAGE_KEY);

	if (json === null || state === null) {
		return;
	}

	let saved: unknown;
	try {
		saved = JSON.parse(json);
	} catch {
		return;
	}

	if (!isSavedState(saved) || saved.state !== state) {
		return;
	}

	return saved.lid;
};
