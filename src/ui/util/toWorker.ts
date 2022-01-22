import { promiseWorker } from ".";
import type api from "../../worker/api";

type API = typeof api;

const toWorker = <
	Type extends
		| "actions"
		| "leagueFileUpload"
		| "main"
		| "playMenu"
		| "toolsMenu",
	Name extends keyof API[Type],
>(
	type: Type,
	name: Name,
	param: Parameters<API[Type][Name]>[0],
) => {
	return promiseWorker.postMessage([type, name, param]);
};

export default toWorker;
