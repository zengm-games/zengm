import { idb } from "../../db";
import { g } from "../../util";
import type { Position } from "../../../common/types.baseball";
import type { PlayerFiltered } from "../../../common/types";

const score = (p: PlayerFiltered, pos?: Position) => {
	if (pos === undefined) {
		return p.ratings.ovr;
	}

	let tempScore = p.ratings.ovrs[pos];

	if (p.ratings.pos === pos) {
		tempScore += 10;
	}

	return tempScore;
};

const sortFunction =
	(pos?: Position) => (a: PlayerFiltered, b: PlayerFiltered) => {
		const diff = score(b, pos) - score(a, pos);
		if (diff === 0) {
			// Deterministic order
			return b.pid - a.pid;
		}
		return diff;
	};

const DEF_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"] as const;
const NUM_STARTERS = 5;

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: "L" | "D" | "P",
) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}
	const depth = t.depth as {
		L: number[];
		D: number[];
		P: number[];
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

	// Lineup last, since that depends on defensive starters
	const positions: (keyof typeof depth)[] = pos ? [pos] : ["P", "D", "L"];

	for (const pos2 of positions) {
		if (onlyNewPlayers) {
			if (pos2 === "L") {
				continue;
			}

			// Identify players not currently in the depth chart, and add them to the depth chart above any player worse
			// than them without otherwise disturbing the order of the depth chart. This is useful for adding free agents to
			// the user's team - start them if they're better, but otherwise don't fuck with the user's depth chart.
			const playersNotInDepth = players.filter(
				p => !depth[pos2].includes(p.pid),
			);

			if (pos2 === "D") {
				const addToBench = [];

				for (const p of playersNotInDepth) {
					let added = false;

					// Put in starting lineup if better than existing starter
					for (let i = 0; i < DEF_POSITIONS.length; i++) {
						const scorePos = DEF_POSITIONS[i];
						const pScore = score(p, scorePos);
						const p2 = players.find(p2 => p2.pid === depth[pos2][i]);
						if (!p2 || pScore > score(p2, scorePos)) {
							depth[pos2][i] = p.pid;
							added = true;
							break;
						}

						if (p2) {
							addToBench.push(p2);
						}
					}

					if (!added) {
						addToBench.push(p);
					}
				}

				// Add any players not put in starting lineup or removed from starting lineup to bench
				for (const p of addToBench) {
					const pScore = score(p);
					let added = false;
					for (let i = DEF_POSITIONS.length; i < depth[pos2].length; i++) {
						const p2 = players.find(p2 => p2.pid === depth[pos2][i]);

						if (!p2 || pScore > score(p2)) {
							depth[pos2].splice(i, 0, p.pid);
							added = true;
							break;
						}
					}

					if (!added) {
						depth[pos2].push(p.pid);
					}
				}
			} else if (pos2 === "P") {
				const addToBullpen = [];

				for (const p of playersNotInDepth) {
					let added = false;

					// Put in starting rotation if better than existing starter
					for (let i = 0; i < NUM_STARTERS; i++) {
						const pScore = score(p, "SP");
						const p2 = players.find(p2 => p2.pid === depth[pos2][i]);
						if (!p2 || pScore > score(p2, "SP")) {
							depth[pos2].splice(i, 0, p.pid);
							added = true;

							// Move last starter to reliever
							const lastStarter = players.find(
								p2 => p2.pid === depth[pos2][NUM_STARTERS],
							);
							if (lastStarter) {
								depth[pos2].splice(NUM_STARTERS, 1);
								addToBullpen.push(lastStarter);
							}

							break;
						}

						if (p2) {
							addToBullpen.push(p2);
						}
					}

					if (!added) {
						addToBullpen.push(p);
					}
				}

				// Add any players not put in starting lineup or removed from starting lineup to bullpen
				for (const p of addToBullpen) {
					const pScore = score(p, "RP");
					let added = false;
					for (let i = NUM_STARTERS; i < depth[pos2].length; i++) {
						const p2 = players.find(p2 => p2.pid === depth[pos2][i]);

						if (!p2 || pScore > score(p2, "RP")) {
							depth[pos2].splice(i, 0, p.pid);
							added = true;
							break;
						}
					}

					if (!added) {
						depth[pos2].push(p.pid);
					}
				}
			}
		} else {
			depth[pos2] = [];

			if (pos2 === "L") {
				depth[pos2] = [6, 4, 5, 1, 7, 3, 2, 0, -1];
			} else if (pos2 === "D") {
				depth[pos2] = [];

				let playersRemaining = players;

				for (const scorePos of DEF_POSITIONS) {
					playersRemaining.sort(sortFunction(scorePos));
					depth[pos2].push(playersRemaining[0].pid);
					playersRemaining = playersRemaining.slice(1);
					if (playersRemaining.length === 0) {
						break;
					}
				}

				playersRemaining.sort(sortFunction());
				depth[pos2].push(...playersRemaining.map(p => p.pid));
			} else if (pos2 === "P") {
				depth[pos2] = [];

				let playersRemaining = players;

				const addStarters = (numToAdd: number) => {
					playersRemaining.sort(sortFunction("SP"));
					for (let i = 0; i < numToAdd; i++) {
						const p = playersRemaining[i];
						if (!p) {
							break;
						}
						depth[pos2].push(p.pid);
					}
					playersRemaining = playersRemaining.slice(numToAdd);
				};

				// Top 3 starters
				addStarters(3);

				// Closer
				playersRemaining.sort(sortFunction("RP"));
				const closer = playersRemaining[0];
				playersRemaining = playersRemaining.slice(1);

				// Remaining 2 starters
				addStarters(2);

				// Everybody else
				if (closer) {
					depth[pos2].push(closer.pid);
				}
				playersRemaining.sort(sortFunction("RP"));
				depth[pos2].push(...playersRemaining.map(p => p.pid));
			}
		}
	}

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
