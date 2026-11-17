import { consumeDropboxAuthState } from "../util/dropboxAuthState.ts";
import { realtimeUpdate } from "../util/realtimeUpdate.ts";
import { safeLocalStorage } from "../util/safeLocalStorage.ts";

const Dropbox = () => {
	const hash = location.hash.slice(1);
	const params = new URLSearchParams(hash);
	const accessToken = params.get("access_token");
	const lid = consumeDropboxAuthState(params.get("state"));
	if (accessToken && lid !== undefined) {
		safeLocalStorage.setItem("dropboxAccessToken", accessToken);
		realtimeUpdate(["firstRun"], `/l/${lid}/export_league`);
		return <>Redirecting...</>;
	}

	return (
		<>
			Connecting to Dropbox failed. Please go back to the Export League page and
			try again.
		</>
	);
};

export default Dropbox;
