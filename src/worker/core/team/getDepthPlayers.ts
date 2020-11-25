import type { Position } from "../../../common/types.football";

// Translate team.depth from pids to player objects, while validating that it contains all players on the team (supplied by `players`) and no extraneous players.
const getDepthPlayers = <
	T extends {
		pid: number;
	}
>(
	depth: Record<Position, number[]>,
	players: T[],
): Record<Position, T[]> => {
	if (process.env.SPORT !== "football") {
		throw new Error("Not implemented");
	}

	// @ts-ignore
	return Object.keys(depth).reduce((obj, pos: Position) => {
		// p.id is for call from play.ts

		// @ts-ignore
		obj[pos] = depth[pos]
			.map(pid => players.find(p => p.pid === pid || (p as any).id === pid))
			.concat(
				players.map(p =>
					depth[pos].includes(p.pid) || depth[pos].includes((p as any).id)
						? undefined
						: p,
				),
			)
			.filter(p => p !== undefined);
		return obj;
	}, {});
};

export default getDepthPlayers;
