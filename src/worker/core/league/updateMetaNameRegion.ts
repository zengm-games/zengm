import { idb } from "../../db";
import { g, local } from "../../util";

const updateMetaNameRegion = async (name: string, region: string) => {
	if (local.autoSave) {
		const l = await idb.meta.get("leagues", g.get("lid"));
		if (!l) {
			throw new Error(`No league with lid ${g.get("lid")} found`);
		}
		l.teamName = name;
		l.teamRegion = region;
		await idb.meta.put("leagues", l);
	}
};

export default updateMetaNameRegion;
