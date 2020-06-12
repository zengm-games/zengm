import { PHASE_TEXT, PHASE } from "../../common";
import { idb } from "../db";
import g from "./g";
import local from "./local";
import toUI from "./toUI";
import type { Conditions } from "../../common/types"; // Calculate phase text in worker rather than UI, because here we can easily cache it in the meta database

async function updatePhase(conditions?: Conditions) {
	let text = PHASE_TEXT[g.get("phase")];

	if (g.get("phase") === PHASE.DRAFT_LOTTERY && g.get("repeatSeason")) {
		text = "after playoffs";
	}

	const phaseText = `${g.get("season")} ${text}`;

	if (phaseText !== local.phaseText) {
		local.phaseText = phaseText;
		toUI("updateLocal", [
			{
				phaseText,
			},
		]);

		// Update phase in meta database. No need to have this block updating the UI or anything.
		(async () => {
			if (idb.meta && local.autoSave) {
				const l = await idb.meta.get("leagues", g.get("lid"));
				if (!l) {
					throw new Error(`No league with lid ${g.get("lid")} found`);
				}
				l.phaseText = phaseText;
				await idb.meta.put("leagues", l);
			}
		})();
	} else if (conditions !== undefined) {
		toUI(
			"updateLocal",
			[
				{
					phaseText,
				},
			],
			conditions,
		);
	}
}

export default updatePhase;
