import type { PlayerGameSim, PlayersOnIce } from "./types.ts";

const getCompositeFactor = ({
	playersOnIce,
	positions,
	synergyFactor,
	synergyRatio,
	valFunc,
}: {
	playersOnIce: PlayersOnIce;
	positions: readonly (readonly ["C" | "W" | "D", number])[];
	synergyFactor: number;
	synergyRatio: number;
	valFunc: (a: PlayerGameSim) => number;
}) => {
	let numerator = 0;
	let denominator = 0;

	for (const [pos, weight] of positions) {
		for (const p of playersOnIce[pos]) {
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
