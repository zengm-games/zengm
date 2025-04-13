import { POSITIONS } from "../../../common/constants.football.ts";
import type { Position } from "../../../common/types.football.ts";
import type { PlayerGameSim, PlayersOnField } from "./types.ts";
import { helpers } from "../../../common/index.ts";

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
