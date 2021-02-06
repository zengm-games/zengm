import type { PlayerGameSim, PlayersOnIce } from "./types";

const getCompositeFactor = ({
	playersOnIce,
	positions,
	valFunc,
}: {
	playersOnIce: PlayersOnIce;
	positions: Record<"C" | "W" | "D", number>;
	valFunc: (a: PlayerGameSim) => number;
}) => {
	let numerator = 0;
	let denominator = 0;

	for (const [pos, weight] of Object.entries(positions)) {
		for (const p of playersOnIce[pos as keyof typeof positions]) {
			numerator += weight * valFunc(p);
			denominator += weight;
		}
	}

	if (denominator === 0) {
		return 0;
	}

	return numerator / denominator;
};

export default getCompositeFactor;
