import type { Position } from "../../../common/types";

// Translate team.depth from pids to player objects, while validating that it contains all players on the team (supplied by `players`) and no extraneous players.
const getDepthPlayers = <
	T extends {
		pid: number;
	}
>(
	depth: Record<Position, number[]>,
	players: T[],
): Record<Position, T[]> => {
	// @ts-ignore
	return Object.keys(depth).reduce((obj, pos: Position) => {
		// @ts-ignore
		obj[pos] = depth[pos]
			.map(pid => players.find(p => p.pid === pid))
			.concat(players.map(p => (depth[pos].includes(p.pid) ? undefined : p)))
			.filter(p => p !== undefined);
		return obj;
	}, {});
};

export default getDepthPlayers;
