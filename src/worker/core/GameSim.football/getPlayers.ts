import { POSITIONS } from "../../../common/constants.football";
import type { Position } from "../../../common/types.football";
import type { PlayerGameSim, PlayersOnField } from "./types";
import { helpers } from "../../../common";

const getPlayers = (
	playersOnField: PlayersOnField,
	positions: Position[] = POSITIONS,
): PlayerGameSim[] => {
	const players: PlayerGameSim[] = [];

	for (const pos of helpers.keys(playersOnField)) {
		if (positions.includes(pos) && playersOnField[pos]) {
			players.push(...playersOnField[pos]);
		}
	}

	return players;
};

export default getPlayers;
