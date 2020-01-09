import { POSITIONS } from "../../../common/constants";
import { Position } from "../../../common/types";
import { PlayerGameSim, PlayersOnField } from "./types";

const getPlayers = (
	playersOnField: PlayersOnField,
	positions: Position[] = POSITIONS,
): PlayerGameSim[] => {
	const players: PlayerGameSim[] = [];

	for (const pos of Object.keys(playersOnField)) {
		if (positions.includes(pos)) {
			players.push(...playersOnField[pos]);
		}
	}

	return players;
};

export default getPlayers;
