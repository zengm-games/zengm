import type { League } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g, local } from "../../util/index.ts";

const updateMeta = async (
	updates?: Partial<Exclude<League, "lid">>,
	lidInput?: number,
	noExtraStuff?: boolean,
) => {
	if (process.env.NODE_ENV === "test") {
		return;
	}

	if (local.autoSave) {
		const transation = await idb.meta.transaction("leagues", "readwrite");

		const lid = lidInput ?? g.get("lid");
		const l = await transation.store.get(lid);
		if (!l) {
			throw new Error(`No league with lid ${lid} found`);
		}

		if (updates) {
			for (const [key, value] of Object.entries(updates)) {
				(l as any)[key] = value;
			}
		}

		if (!noExtraStuff) {
			// Hacky try/catch, but basically want to ignore any errors from a g variable not being set
			try {
				if (g.get("lid") !== undefined) {
					// Upgrade
					if (l.startingSeason === undefined) {
						l.startingSeason = g.get("startingSeason");
					}

					// Just do this here, rather than figuring out when it should be updated exactly
					const teamInfo = g.get("teamInfoCache")[g.get("userTid")];
					if (teamInfo) {
						if (g.get("userTids").length > 1) {
							l.teamName = "Multi Team Mode";
							l.teamRegion = "";
							l.imgURL = `https://zengm.com/files/logo-${process.env.SPORT}.svg`;
						} else {
							l.teamName = teamInfo.name;
							l.teamRegion = teamInfo.region;
							l.imgURL = teamInfo.imgURLSmall ?? teamInfo.imgURL;
						}
					}
				}
			} catch (error) {
				console.error(error);
			}
		}

		await transation.store.put(l);
		await transation.done;
	}
};

export default updateMeta;
