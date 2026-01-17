import { PHASE } from "../../../common/constants.ts";
import type { Phase, PlayerWithoutKey } from "../../../common/types.ts";
import g from "../../util/g.ts";

const setJerseyNumber = (
	p: PlayerWithoutKey,
	jerseyNumber: string,
	options?: {
		phase: Phase;
	},
) => {
	// Current jersey number is always stored in root, even if there is no corresponding stats entry available at the moment (like in the offseason)
	p.jerseyNumber = jerseyNumber;

	// Only update stats record if there is a current one for an in-progress season/playoffs
	if (p.tid >= 0) {
		const stats = p.stats.at(-1);
		const phase = options?.phase ?? g.get("nextPhase") ?? g.get("phase");
		const season = g.get("season");
		if (
			stats &&
			stats.tid === p.tid &&
			stats.season === season &&
			((phase < PHASE.PLAYOFFS && !stats.playoffs) ||
				(phase === PHASE.PLAYOFFS && stats.playoffs))
		) {
			stats.jerseyNumber = jerseyNumber;
		}
	}
};

export default setJerseyNumber;
