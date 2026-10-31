import { league } from "../core/index.ts";
import { idb } from "./index.ts";
import { logEvent } from "../util/index.ts";

const reset = async (type: "all" | "unstarred") => {
	// Delete any current league databases
	const leagues = await idb.meta.getAll("leagues");

	const leaguesToDelete =
		type === "unstarred" ? leagues.filter((l) => !l.starred) : leagues;

	let numDeleted = 0;
	for (const l of leaguesToDelete) {
		if (type === "unstarred" && l.starred) {
			continue;
		}

		await league.remove(l.lid);
		numDeleted += 1;
		await logEvent({
			type: "info",
			text: `Deleted ${numDeleted} of ${leaguesToDelete.length} leagues...`,
			saveToDb: false,
		});
	}

	// Delete all leagues from meta database, completely! For zombie entries in meta.
	if (type === "all") {
		await (await idb.meta.transaction("leagues", "readwrite")).store.clear();
	}
};

export default reset;
