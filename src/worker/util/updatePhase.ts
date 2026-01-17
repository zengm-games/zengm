import {
	NO_LOTTERY_DRAFT_TYPES,
	PHASE_TEXT,
	PHASE,
} from "../../common/index.ts";
import g from "./g.ts";
import local from "./local.ts";
import toUI from "./toUI.ts";
import type { Conditions } from "../../common/types.ts";
import { league } from "../core/index.ts";

// Calculate phase text in worker rather than UI, because here we can easily cache it in the meta database
async function updatePhase(conditions?: Conditions) {
	let text = PHASE_TEXT[g.get("phase")];

	if (
		g.get("phase") === PHASE.DRAFT_LOTTERY &&
		(g.get("repeatSeason") ||
			g.get("forceHistoricalRosters") ||
			NO_LOTTERY_DRAFT_TYPES.includes(g.get("draftType")))
	) {
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
		league.updateMeta({
			phaseText,
			season: g.get("season"),
		});
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
