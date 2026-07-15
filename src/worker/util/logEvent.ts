import { createLogger } from "../../common/createLogger.ts";
import { idb } from "../db/index.ts";
import g from "./g.ts";
import toUI from "./toUI.ts";
import type { Conditions, LogEventSaveOptions } from "../../common/types.ts";
import type { ShowNotificationOptions } from "../../ui/util/showNotification.ts";

const saveEvent = (event: LogEventSaveOptions) => {
	return idb.cache.events.add({ ...event, season: g.get("season") });
};

// conditions only needed when showNotification is true, otherwise this is never called
const logEvent = createLogger(
	saveEvent,
	(options: ShowNotificationOptions, conditions?: Conditions) => {
		toUI("showNotification", [options], conditions);
	},
);

export default logEvent;
