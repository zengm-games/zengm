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
	if (!isSport("baseball") && !isSport("football") && !isSport("hockey")) {
		throw new Error("Not implemented");
	}

	// @ts-expect-error
	const depths: Record<string, T[]> = Object.keys(depth).reduce(
		(obj, pos: string) => {
			// p.id is for call from play.ts

			if (isSport("baseball") && pos === "L") {
				// Lineup IDs are references to positions

				return obj;
			}

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
		},
		{},
	);

	if (isSport("baseball")) {
		// Lineup IDs are references to positions
		// -1 -> pitcher
		// -2 or less -> does not exist (not enough players)

		const DEFAULT_LINEUP = [6, 4, 5, 1, 7, 3, 2, 0, -1];

		let lineup = (
			depth as {
				L: number[];
			}
		).L;

		if (!lineup || lineup.length !== DEFAULT_LINEUP.length) {
			lineup = DEFAULT_LINEUP;
		}

		let dummyID = -1;
		// @ts-expect-error
		depths.L = lineup.map(i => {
			if (i === -1) {
				return {
					pid: -1,
					id: -1,
				};
			}

			if (depths.D[i]) {
				return depths.D[i];
			}

			dummyID -= 1;
			return {
				pid: dummyID,
				id: dummyID,
			};
		});
	}

	return depths;
};

export default getDepthPlayers;
