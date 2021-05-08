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

const sortFunction = (pos: Position) => (
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

const getPlayersInLines = <
	T extends {
		ratings: {
			ovrs: Record<string, number>;
			pos: string;
		};
	}
>(
	players: T[],
) => {
	const info = {
		C: {
			selected: [] as T[],
			minLength: NUM_LINES.F * 1,
			sorted: [...players].sort(sortFunction("C")),
		},
		W: {
			selected: [] as T[],
			minLength: NUM_LINES.F * 2,
			sorted: [...players].sort(sortFunction("W")),
		},
		D: {
			selected: [] as T[],
			minLength: NUM_LINES.D * NUM_PLAYERS_PER_LINE.D,
			sorted: [...players].sort(sortFunction("D")),
		},
		G: {
			selected: [] as T[],
			minLength: NUM_LINES.G * NUM_PLAYERS_PER_LINE.G,
			sorted: [...players].sort(sortFunction("G")),
		},
	};

	const maxLength = Math.max(...Object.values(info).map(x => x.minLength));

	// Set starters (in lines)
	const playersUsed = new Set<typeof players[number]>();
	for (let i = 0; i < maxLength; i++) {
		for (const pos of ["G", "C", "D", "W"] as const) {
			const { selected, minLength, sorted } = info[pos];
			if (selected.length >= minLength) {
				continue;
			}

			for (const p of sorted) {
				if (!playersUsed.has(p)) {
					selected.push(p);
					playersUsed.add(p);
					break;
				}
			}
		}
	}

	return info;
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

	const info = getPlayersInLines(players);

	// Order here matters, since players can only appear once!
	const positions: (keyof typeof depth)[] = pos ? [pos] : ["G", "D", "F"];

	for (const pos2 of positions) {
		if (onlyNewPlayers) {
			// Identify players not currently in the depth chart, and add them to the depth chart above any player worse
			// than them without otherwise disturbing the order of the depth chart. This is useful for adding free agents to
			// the user's team - start them if they're better, but otherwise don't fuck with the user's depth chart.
			const playersNotInDepth = players.filter(
				p => !depth[pos2].includes(p.pid),
			);

			for (const p of playersNotInDepth) {
				const addToDepth = (
					depthPos: "G" | "D" | "F",
					scorePos: "G" | "D" | "C",
				) => {
					const pScore = score(p, scorePos);
					let added = false;

					for (let i = 0; i < depth[pos2].length; i++) {
						const p2 = players.find(p3 => p3.pid === depth[depthPos][i]);

						if (!p2 || pScore > score(p2, scorePos)) {
							depth[depthPos].splice(i, 0, p.pid);
							added = true;
							break;
						}
					}

					if (!added) {
						depth[depthPos].push(p.pid);
						added = true;
					}
				};

				if (pos2 === "G" || pos2 === "D") {
					addToDepth(pos2, pos2);
				} else {
					const startingC = [depth.F[0], depth.F[3], depth.F[6], depth.F[9]];
					const startingW = [
						depth.F[1],
						depth.F[2],
						depth.F[4],
						depth.F[5],
						depth.F[7],
						depth.F[8],
						depth.F[10],
						depth.F[11],
					];

					const scoresStartingC = startingC.map(pid => {
						const p2 = players.find(p3 => p3.pid === pid);
						return p2 ? score(p2, "C") : -Infinity;
					});
					const scoresStartingW = startingW.map(pid => {
						const p2 = players.find(p3 => p3.pid === pid);
						return p2 ? score(p2, "W") : -Infinity;
					});

					const scoreC = score(p, "C");
					const scoreW = score(p, "W");

					let added = false;

					for (let line = 0; line < 4; line++) {
						if (scoreC > scoresStartingC[line]) {
							startingC.splice(line, 0, p.pid);
							added = true;
							break;
						}

						if (scoreW > scoresStartingW[line * 2]) {
							startingW.splice(line * 2, 0, p.pid);
							added = true;
							break;
						}

						if (scoreW > scoresStartingW[line * 2 + 1]) {
							startingW.splice(line * 2 + 1, 0, p.pid);
							added = true;
							break;
						}
					}

					if (added) {
						// Recompute lines, with everyone shifted down
						const oldDepth = [...depth.F];
						depth.F = [
							startingC[0],
							startingW[0],
							startingW[1],
							startingC[1],
							startingW[2],
							startingW[3],
							startingC[2],
							startingW[4],
							startingW[5],
							startingC[3],
							startingW[6],
							startingW[7],
						];

						depth.F.push(...oldDepth.filter(pid => !depth.F.includes(pid)));
					} else {
						// Add somewhere to the end, based on scoreC
						addToDepth("F", "C");
					}

					// Just in case...
					depth.F = depth.F.filter(p => p !== undefined);
				}
			}
		} else {
			depth[pos2] = [];

			if (pos2 === "G" || pos2 === "D") {
				const { selected, sorted } = info[pos2];
				depth[pos2].push(...selected.map(p => p.pid));
				depth[pos2].push(
					...sorted.filter(p => !selected.includes(p)).map(p => p.pid),
				);
			} else {
				const playersUsed = new Set();

				for (let i = 0; i < NUM_LINES[pos2]; i++) {
					// Find a center
					for (const p of info.C.selected) {
						if (!playersUsed.has(p)) {
							depth[pos2].push(p.pid);
							playersUsed.add(p);
							break;
						}
					}

					// Find 2 wings
					let wingCount = 0;
					for (const p of info.W.selected) {
						if (!playersUsed.has(p)) {
							depth[pos2].push(p.pid);
							playersUsed.add(p);

							wingCount += 1;
							if (wingCount === 2) {
								break;
							}
						}
					}
				}

				depth[pos2].push(
					...info.C.sorted.filter(p => !playersUsed.has(p)).map(p => p.pid),
				);
			}
		}
	}

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
