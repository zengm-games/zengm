import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import type { EventBBGM } from "../../../common/types";

const getCopies = async ({
	pid,
	season,
	filter = () => true,
}: {
	pid?: number;
	season?: number;
	filter?: (event: EventBBGM) => boolean;
} = {}): Promise<EventBBGM[]> => {
	if (season !== undefined && pid !== undefined) {
		throw new Error("Can't currently filter by season and pid");
	}

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
		).filter(filter);
	}

	if (pid !== undefined) {
		return mergeByPk(
			await idb.league.transaction("events").store.index("pids").getAll(pid),
			(await idb.cache.events.getAll()).filter(event => {
				return event.pids !== undefined && event.pids.includes(pid);
			}),
			"events",
		).filter(filter);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("events").store, undefined, filter),
		await idb.cache.events.getAll(),
		"events",
	).filter(filter);
};

export default getCopies;
