import type { Env } from "../../common/types.ts";

// Default values, to be overwritten on initialization by global variables from ui
export const env: Env = {
	bbgmVersion: "",
	enableLogging: false,
	heartbeatID: "",
	mobile: false,
	useSharedWorker: false,
};
