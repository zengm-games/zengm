import { PHASE_TEXT } from "../../common";
import { idb } from "../db";
import g from "./g";
import local from "./local";
import toUI from "./toUI";
import { Conditions } from "../../common/types"; // Calculate phase text in worker rather than UI, because here we can easily cache it in the meta database

async function updatePhase(conditions?: Conditions) {
	const phaseText = `${g.get("season")} ${PHASE_TEXT[g.get("phase")]}`;

	if (phaseText !== local.phaseText) {
		local.phaseText = phaseText;
		toUI("updateLocal", [
			{
				phaseText,
			},
		]);

		// Update phase in meta database. No need to have this block updating the UI or anything.
		(async () => {
			if (idb.meta) {
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
