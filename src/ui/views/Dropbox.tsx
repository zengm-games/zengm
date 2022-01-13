import { realtimeUpdate } from "../util";

const Dropbox = () => {
	const hash = location.hash.slice(1);
	const params = new URLSearchParams(hash);
	const lid = parseInt(params.get("state")!);
	const accessToken = params.get("access_token");
	if (accessToken && !Number.isNaN(lid)) {
		localStorage.setItem("dropboxAccessToken", accessToken);
		realtimeUpdate(["firstRun"], `/l/${lid}/export_league`);
	}

	return <>Redirecting...</>;
};

export default Dropbox;
