import type { PlayerGameSim, PlayersOnIce } from "./types";

const getCompositeFactor = ({
	playersOnIce,
	positions,
	synergyFactor,
	synergyRatio,
	valFunc,
}: {
	playersOnIce: PlayersOnIce;
	positions: Record<"C" | "W" | "D", number>;
	synergyFactor: number;
	synergyRatio: number;
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

	return (numerator / denominator) * synergyRatio ** synergyFactor;
};

export default getCompositeFactor;
