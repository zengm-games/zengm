import { createLogger } from "../../common";
import { idb } from "../db";
import g from "./g";
import toUI from "./toUI";
import type {
	Conditions,
	LogEventSaveOptions,
	LogEventShowOptions,
} from "../../common/types";

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
