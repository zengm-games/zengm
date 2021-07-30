import type { League } from "../../../common/types";
import { idb } from "../../db";
import { g, local } from "../../util";

const updateMeta = async (updates: Partial<Exclude<League, "lid">>) => {
	if (idb.meta && local.autoSave) {
		const transation = idb.meta.transaction("leagues", "readwrite");

		const lid = g.get("lid");
		const l = await transation.store.get(lid);
		if (!l) {
			throw new Error(`No league with lid ${lid} found`);
		}

		for (const [key, value] of Object.entries(updates)) {
			(l as any)[key] = value;
		}

		// Upgrade
		if (l.startingSeason === undefined) {
			l.startingSeason = g.get("startingSeason");
		}

		// Just do this here, rather than figuring out when it should be updated exactly
		const teamInfo = g.get("teamInfoCache")[g.get("userTid")];
		if (teamInfo) {
			l.imgURL = teamInfo.imgURLSmall ?? teamInfo.imgURL;
		}

		await transation.store.put(l);
		await transation.done;
	}
};

export default updateMeta;
