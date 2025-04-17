import type { Env } from "../../common/types.ts";

// Default values, to be overwritten on initialization by global variables from ui
const env: Env = {
	enableLogging: false,
	heartbeatID: "",
	mobile: false,
	useSharedWorker: false,
};

export default env;
