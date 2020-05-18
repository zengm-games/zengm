import { league } from "../core";
import { idb } from ".";
import { logEvent } from "../util";

const reset = async () => {
	// Delete any current league databases
	console.log("Deleting any current league databases...");
	const leagues = await idb.meta.getAll("leagues");
	let numDeleted = 0;
	await Promise.all(
		leagues.map(async l => {
			await league.remove(l.lid);
			numDeleted += 1;
			logEvent({
				type: "info",
				text: `Deleted ${numDeleted} of ${leagues.length} leagues...`,
				saveToDb: false,
			});
		}),
	);

	// Delete leagues from meta database
	await idb.meta.transaction("leagues", "readwrite").store.clear();
};

export default reset;
