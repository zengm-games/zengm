import { createLogger } from "../../common";
import { idb } from "../db";
import g from "./g";
import toUI from "./toUI";
import {
	Conditions,
	LogEventSaveOptions,
	LogEventShowOptions,
} from "../../common/types";

const saveEvent = (event: LogEventSaveOptions) => {
	idb.cache.events.add({ ...event, season: g.season });
}; // conditions only needed when showNotification is true, otherwise this is never called

const logEvent = createLogger(
	saveEvent,
	(options: LogEventShowOptions, conditions?: Conditions) => {
		toUI(["showEvent", options], conditions);
	},
);
export default logEvent;
