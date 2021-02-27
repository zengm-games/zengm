import { idb } from "../../db";
import { g } from "../../util";
import {
	NUM_LINES,
	NUM_PLAYERS_PER_LINE,
} from "../../../common/constants.hockey";
import type { Position } from "../../../common/types.hockey";
import type { PlayerFiltered } from "../../../common/types";

const score = (p: PlayerFiltered, pos: Position) => {
	let tempScore = p.ratings.ovrs[pos];

	if (p.ratings.pos === pos) {
		tempScore += 15;
	}

	return tempScore;
};

export const sortFunction = (pos: Position) => (
	a: PlayerFiltered,
	b: PlayerFiltered,
) => {
	const diff = score(b, pos) - score(a, pos);
	if (diff === 0) {
		// Deterministic order
		return b.pid - a.pid;
	}
	return diff;
};

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: "F" | "D" | "G",
) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}
	const depth = t.depth as {
		F: number[];
		D: number[];
		G: number[];
	};

	if (depth === undefined) {
		throw new Error("Missing depth");
	}

	const playersFromCache = await idb.cache.players.indexGetAll(
		"playersByTid",
		tid,
	);
	const players = await idb.getCopies.playersPlus(playersFromCache, {
		attrs: ["pid"],
		ratings: ["pos", "ovrs"],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});

	// Order here matters, since players can only appear once!
	const positions = ["G", "D", "F"] as const;
	const pidsInRotation = new Set();

	for (const pos2 of positions) {
		if (onlyNewPlayers) {
			console.log(pos);
			throw new Error("not implemented yet");
			/*// Identify players not currently in the depth chart, and add them to the depth chart above any player worse
			// than them without otherwise disturbing the order of the depth chart. This is useful for adding free agents to
			// the user's team - start them if they're better, but otherwise don't fuck with the user's depth chart.
			const playersNotInDepth = players.filter(
				p => !depth[pos2].includes(p.pid),
			);

			for (const p of playersNotInDepth) {
				const pScore = score(p, pos2);
				let added = false;

				for (let i = 0; i < depth[pos2].length; i++) {
					const p2 = players.find(p3 => p3.pid === depth[pos2][i]);

					if (!p2 || pScore > score(p2, pos2)) {
						depth[pos2].splice(i, 0, p.pid);
						added = true;
						break;
					}
				}

				if (!added) {
					depth[pos2].push(p.pid);
					added = true;
				}
			}*/
		} else {
			depth[pos2] = [];

			if (pos2 === "G" || pos2 === "D") {
				players.sort(sortFunction(pos2));

				let numRotationPlayersLeft =
					NUM_LINES[pos2] * NUM_PLAYERS_PER_LINE[pos2];

				const pidsInThisPosition = new Set();

				// First find rotation players
				for (const p of players) {
					if (!pidsInRotation.has(p.pid)) {
						depth[pos2].push(p.pid);

						pidsInRotation.add(p.pid);
						pidsInThisPosition.add(p.pid);

						numRotationPlayersLeft -= 1;
					}

					if (numRotationPlayersLeft === 0) {
						break;
					}
				}

				// Add the rest
				for (const p of players) {
					if (!pidsInThisPosition.has(p.pid)) {
						depth[pos2].push(p.pid);
					}
				}
			} else {
				// Forwards - always do C W W unless impossible!
				const playersC = [...players.sort(sortFunction("C"))];
				const playersW = [...players.sort(sortFunction("W"))];

				const pidsInThisPosition = new Set();

				for (let i = 0; i < NUM_LINES[pos2]; i++) {
					// Find a center
					for (const p of playersC) {
						if (!pidsInRotation.has(p.pid)) {
							depth[pos2].push(p.pid);
							pidsInRotation.add(p.pid);
							pidsInThisPosition.add(p.pid);
							break;
						}
					}

					// Find 2 wings
					let wingCount = 0;
					for (const p of playersW) {
						if (!pidsInRotation.has(p.pid)) {
							depth[pos2].push(p.pid);
							pidsInRotation.add(p.pid);
							pidsInThisPosition.add(p.pid);

							wingCount += 1;
							if (wingCount === 2) {
								break;
							}
						}
					}
				}

				// Add the rest
				for (const p of playersC) {
					if (!pidsInThisPosition.has(p.pid)) {
						depth[pos2].push(p.pid);
					}
				}
			}
		}
	}

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
