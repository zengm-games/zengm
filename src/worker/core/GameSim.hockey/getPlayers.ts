import { POSITIONS } from "../../../common/constants.hockey";
import type { Position } from "../../../common/types.hockey";
import type { PlayerGameSim, PlayersOnIce } from "./types";
import { helpers } from "../../../common";

const getPlayers = (
	playersOnIce: PlayersOnIce,
	positions: Position[] = POSITIONS,
): PlayerGameSim[] => {
	const players: PlayerGameSim[] = [];

	for (const pos of helpers.keys(playersOnIce)) {
		if (positions.includes(pos) && playersOnIce[pos]) {
			players.push(...playersOnIce[pos]);
		}
	}

	return players;
};

export default getPlayers;
