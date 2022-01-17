import { getAll, idb } from "..";
import { maybeDeepCopy, mergeByPk } from "./helpers";
import type { EventBBGM, GetCopyType } from "../../../common/types";

type Filter = (event: EventBBGM) => boolean;

const getCopies = async (
	input:
		| {
				filter?: Filter;
		  }
		| {
				eid: number;
				filter?: Filter;
		  }
		| {
				dpid: number;
				filter?: Filter;
		  }
		| {
				pid: number;
				filter?: Filter;
		  }
		| {
				season: number;
				filter?: Filter;
		  } = {},
	type?: GetCopyType,
): Promise<EventBBGM[]> => {
	const {
		eid,
		dpid,
		pid,
		season,
		filter = () => true,
	} = input as {
		eid?: number;
		dpid?: number;
		pid?: number;
		season?: number;
		filter?: Filter;
	};

	if (season !== undefined) {
		return mergeByPk(
			await idb.league
				.transaction("events")
				.store.index("season")
				.getAll(season),
			(await idb.cache.events.getAll()).filter(event => {
				return event.season === season;
			}),
			"events",
			type,
		).filter(filter);
	}

	if (pid !== undefined) {
		return mergeByPk(
			await idb.league.transaction("events").store.index("pids").getAll(pid),
			(await idb.cache.events.getAll()).filter(event => {
				return event.pids !== undefined && event.pids.includes(pid);
			}),
			"events",
			type,
		).filter(filter);
	}

	if (dpid !== undefined) {
		return mergeByPk(
			await idb.league.transaction("events").store.index("dpids").getAll(dpid),
			(await idb.cache.events.getAll()).filter(event => {
				return event.dpids !== undefined && event.dpids.includes(dpid);
			}),
			"events",
			type,
		).filter(filter);
	}

	if (eid !== undefined) {
		const event = await idb.cache.events.get(eid);
		if (event) {
			return [maybeDeepCopy(event, type)];
		}

		const event2 = await idb.league.get("events", eid);
		if (event2) {
			return [event2];
		}

		return [];
	}

	return mergeByPk(
		await getAll(idb.league.transaction("events").store, undefined, filter),
		await idb.cache.events.getAll(),
		"events",
		type,
	).filter(filter);
};

export default getCopies;
