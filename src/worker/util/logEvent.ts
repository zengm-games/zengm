import { createLogger } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import toUI from "./toUI.ts";
import type {
	Conditions,
	LogEventSaveOptions,
	LogEventShowOptions,
} from "../../common/types.ts";

const saveEvent = (event: LogEventSaveOptions) => {
	return idb.cache.events.add({ ...event, season: g.get("season") });
};

// conditions only needed when showNotification is true, otherwise this is never called
const logEvent = createLogger(
	saveEvent,
	(options: LogEventShowOptions, conditions?: Conditions) => {
		toUI("showEvent", [options], conditions);
	},
);

export default logEvent;
