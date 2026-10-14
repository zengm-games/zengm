import type { EventBBGM } from "../../../common/types.ts";
import { idb } from "../index.ts";
import {
	emitAll,
	emitEach,
	makeStore,
	type Exclusive,
	type Query,
} from "./engine.ts";

export type EventsSelector = Exclusive<
	{ season: number } | { pid: number } | { dpid: number }
>;

const toQuery = (selector: EventsSelector): Query<EventBBGM> => {
	if (selector.season !== undefined) {
		const season = selector.season;
		return {
			// Events are small, and this runs on every game day when the league dashboard is open, so it's worth reading them all at once
			fromDb: (emit) =>
				emitAll(
					idb.league.transaction("events").store.index("season").getAll(season),
					emit,
				),
			matches: (event) => event.season === season,
		};
	}

	if (selector.pid !== undefined) {
		const pid = selector.pid;
		return {
			fromDb: (emit) =>
				emitEach(
					idb.league.transaction("events").store.index("pids").iterate(pid),
					emit,
				),
			matches: (event) => event.pids !== undefined && event.pids.includes(pid),
		};
	}

	if (selector.dpid !== undefined) {
		const dpid = selector.dpid;
		return {
			fromDb: (emit) =>
				emitEach(
					idb.league.transaction("events").store.index("dpids").iterate(dpid),
					emit,
				),
			matches: (event) =>
				event.dpids !== undefined && event.dpids.includes(dpid),
		};
	}

	throw new Error("Invalid selector");
};

export default makeStore("events", toQuery);
