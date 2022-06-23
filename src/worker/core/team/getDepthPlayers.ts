import range from "lodash-es/range";
import { isSport, POSITIONS } from "../../../common";
import type { Team } from "../../../common/types";

// Translate team.depth from pids to player objects, while validating that it contains all players on the team (supplied by `players`) and no extraneous players.
const getDepthPlayers = <
	T extends {
		pid: number;
	},
>(
	depth: Team["depth"],
	players: T[],
	dh?: boolean,
): Record<string, T[]> => {
	if (!isSport("baseball") && !isSport("football") && !isSport("hockey")) {
		throw new Error("Not implemented");
	}

	// @ts-expect-error
	const depths: Record<string, T[]> = Object.keys(depth).reduce(
		(obj, pos: string) => {
			// p.id is for call from play.ts

			if (isSport("baseball") && (pos === "L" || pos === "LP")) {
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

			// Break referential integrity between D and DP, otherwise linupIndex and lineupPos get overwritten. But do it for the one we're not interested in, based on DH setting. This is needed for game sim to record stuff correctly.
			if (
				isSport("baseball") &&
				((dh && pos === "DP") || (!dh && pos === "D"))
			) {
				// @ts-expect-error
				obj[pos] = obj[pos].map(p => ({ ...p }));
			}

			return obj;
		},
		{},
	);

	if (isSport("baseball")) {
		// Lineup IDs are references to positions
		// -1 -> pitcher/DH
		// -2 or less -> does not exist (not enough players)

		const lineupKeys = ["L", "LP"] as const;

		for (const key of lineupKeys) {
			const defenseKey = key === "L" ? "D" : "DP";

			const DEFAULT_LINEUP = key === "L" ? range(0, 9) : range(-1, 8);

			let lineup = (depth as Record<string, number[]>)[key];

			if (!lineup || lineup.length !== DEFAULT_LINEUP.length) {
				lineup = DEFAULT_LINEUP;
			}

			let dummyID = -1;
			// @ts-expect-error
			depths[key] = lineup.map(i => {
				if (i === -1) {
					return {
						pid: -1,
						id: -1,
						lineupPos: "P",
						lineupIndex: -1,
					};
				}

				if (depths.D[i]) {
					// IMPORTANT - maintain referential integrity
					return Object.assign(depths[defenseKey][i], {
						lineupPos: POSITIONS[2 + i],
						lineupIndex: i,
					});
				}

				dummyID -= 1;
				return {
					pid: dummyID,
					id: dummyID,
					lineupPos: "?",
					lineupIndex: dummyID,
				};
			});
		}
	}

	return depths;
};

export default getDepthPlayers;
