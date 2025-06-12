import type { Phase } from "../../common/types.ts";
import g from "./g.ts";

// I wish I hadn't made expansion/fantasy drafts affect g.phase...
export const actualPhase = (
	phaseOverride?: Phase,
	nextPhaseOverride?: Phase,
) => {
	return (
		nextPhaseOverride ?? phaseOverride ?? g.get("nextPhase") ?? g.get("phase")
	);
};
