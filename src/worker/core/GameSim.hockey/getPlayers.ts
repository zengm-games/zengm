import { POSITIONS } from "../../../common/constants.hockey.ts";
import type { Position } from "../../../common/types.hockey.ts";
import type { PlayerGameSim, PlayersOnIce } from "./types.ts";
import { helpers } from "../../../common/index.ts";

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
