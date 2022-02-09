import { isSport } from "../../../common";
import type { Team } from "../../../common/types";

// Translate team.depth from pids to player objects, while validating that it contains all players on the team (supplied by `players`) and no extraneous players.
const getDepthPlayers = <
	T extends {
		pid: number;
	},
>(
	depth: Team["depth"],
	players: T[],
): Record<string, T[]> => {
	if (!isSport("football") && !isSport("hockey")) {
		throw new Error("Not implemented");
	}

	// @ts-expect-error
	return Object.keys(depth).reduce((obj, pos: string) => {
		// p.id is for call from play.ts

		// @ts-expect-error
		obj[pos] = (depth[pos] as number[])
			.map(pid => players.find(p => p.pid === pid || (p as any).id === pid))
			.concat(
				players.map(p =>
					(depth as any)[pos].includes(p.pid) ||
					(depth as any)[pos].includes((p as any).id)
						? undefined
						: p,
				),
			)
			.filter(p => p !== undefined);
		return obj;
	}, {});
};

export default getDepthPlayers;
