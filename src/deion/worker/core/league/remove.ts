import { deleteDB } from "idb";
import close from "./close";
import { idb } from "../../db";
import { g, logEvent } from "../../util";

const remove = async (lid: number) => {
	if (g.get("lid") === lid) {
		close(true);
	}

	await idb.meta.delete("leagues", lid);
	await deleteDB(`league${lid}`, {
		blocked() {
			logEvent({
				type: "error",
				text: "Please close any other open tabs.",
				saveToDb: false,
			});
		},
	});
};

export default remove;
