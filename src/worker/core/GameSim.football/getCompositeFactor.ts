import getPlayers from "./getPlayers.ts";
import type { Position } from "../../../common/types.football.ts";
import type { PlayerGameSim, PlayersOnField } from "./types.ts";
import { orderBy } from "../../../common/utils.ts";

// weightsBonus is not added to denominator, it just gives a bonus in situations e.g. with extra receivers or blockers beyond normal
const getCompositeFactor = ({
	playersOnField,
	positions,
	orderFunc,
	weightsMain,
	weightsBonus,
	valFunc,
}: {
	playersOnField: PlayersOnField;
	positions: Position[];
	orderFunc: (a: PlayerGameSim) => number;
	weightsMain: number[];
	weightsBonus: number[];
	valFunc: (a: PlayerGameSim) => number;
}) => {
	const maxNum = weightsMain.length + weightsBonus.length;
	const players = orderBy(
		getPlayers(playersOnField, positions),
		orderFunc,
		"desc",
	).slice(0, maxNum);
	let factor = 0;

	if (players.length > 0) {
		let numerator = 0;
		let denominator = 0;

		for (const [i, p] of players.entries()) {
			const main = i < weightsMain.length;
			const weight = main
				? weightsMain[i]
				: weightsBonus[i - weightsMain.length];

			if (typeof weight !== "number") {
				throw new Error("weight should always be number");
			}

			numerator += weight * valFunc(p);

			if (main) {
				denominator += weight;
			}
		}

		factor = numerator / denominator;
	}

	return factor;
};

export default getCompositeFactor;
