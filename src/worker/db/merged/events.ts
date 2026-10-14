import type { EventBBGM } from "../../../common/types.ts";
import { idb } from "../index.ts";
import { MergedStore, type Exclusive, type Query } from "./engine.ts";

export type EventsSelector = Exclusive<
	{ season: number } | { pid: number } | { dpid: number }
>;

class EventsStore extends MergedStore<"events", EventsSelector> {
	protected override toQuery(
		selector: EventsSelector | undefined,
	): Query<EventBBGM> | undefined {
		if (selector === undefined) {
			return undefined;
		}

		if (selector.season !== undefined) {
			const season = selector.season;
			return {
				// Events are small, and this runs on every game day when the league dashboard is open, so it's worth reading them all at once
				fromDb: () =>
					idb.league.transaction("events").store.index("season").getAll(season),
				matches: (event) => event.season === season,
			};
		}

		if (selector.pid !== undefined) {
			const pid = selector.pid;
			return {
				fromDb: () =>
					idb.league.transaction("events").store.index("pids").iterate(pid),
				matches: (event) =>
					event.pids !== undefined && event.pids.includes(pid),
			};
		}

		if (selector.dpid !== undefined) {
			const dpid = selector.dpid;
			return {
				fromDb: () =>
					idb.league.transaction("events").store.index("dpids").iterate(dpid),
				matches: (event) =>
					event.dpids !== undefined && event.dpids.includes(dpid),
			};
		}

		throw new Error("Invalid selector");
	}
}

export default new EventsStore("events");
