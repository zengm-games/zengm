import g from "./g.ts";

// I wish I hadn't made expansion/fantasy drafts affect g.phase...
export const actualPhase = (
	phase = g.get("phase"),
	nextPhase = g.get("nextPhase"),
) => {
	return nextPhase ?? phase;
};
