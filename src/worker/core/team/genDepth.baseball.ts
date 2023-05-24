import { idb } from "../../db";
import { g, helpers, local, random } from "../../util";
import type { Position } from "../../../common/types.baseball";
import type { Player, PlayerFiltered } from "../../../common/types";
import { groupByUnique } from "../../../common/groupBy";
import orderBy from "lodash-es/orderBy";

const score = (p: PlayerFiltered, pos?: Position) => {
	if (pos === undefined) {
		return p.ratings.ovr;
	}

	let tempScore = p.ratings.ovrs[pos];

	if (p.ratings.pos === pos) {
		if (pos === "C") {
			// More likely to put actual catcher at catcher
			tempScore += 25;
		} else if (pos !== "RP") {
			// Relief pitcher, who cares about "right" position
			tempScore += 10;
		}
	}

	return tempScore;
};

const DEF_POSITIONS = ["C", "1B", "2B", "3B", "SS", "LF", "CF", "RF"] as const;
const DEF_POSITIONS_DH = [
	"C",
	"1B",
	"2B",
	"3B",
	"SS",
	"LF",
	"CF",
	"RF",
	"DH",
] as const;
const NUM_STARTERS = 5;

export const lineupSort = (ovrDH: number, spd: number) => ovrDH + 0.2 * spd;

const findMaxBy = <T extends unknown>(
	records: T[],
	count: number,
	getScore: (record: T) => number,
) => {
	const output: {
		index: number;
		record: T;
		score: number;
	}[] = [];

	const addToOutput = (x: (typeof output)[number]) => {
		for (let i = 0; i < count - 1; i++) {
			if (output[i] === undefined) {
				output[i] = x;
				return;
			} else if (output[i].score < x.score) {
				output.splice(i, 0, x);
				return;
			}
		}

		output[count - 1] = x;
	};

	for (let i = 0; i < records.length; i++) {
		const record = records[i];
		const score = getScore(record);
		if (output.length < count || score > output[count - 1].score) {
			addToOutput({
				index: i,
				record,
				score,
			});
		}
	}

	return output.slice(0, count);
};

export const getDepthDefense = (
	players: {
		pid: number;
		ratings: {
			ovrs: Record<string, number>;
			pos: string;
		};
	}[],
	dh: boolean,
) => {
	const defensivePlayersSorted: typeof players = [];

	const playersRemaining = [...players];

	const defPositions = dh ? DEF_POSITIONS_DH : DEF_POSITIONS;

	if (playersRemaining.length > 0) {
		for (const scorePos of defPositions) {
			const maxIndex = findMaxBy(playersRemaining, 1, p =>
				score(p, scorePos),
			)[0].index;

			defensivePlayersSorted.push(playersRemaining[maxIndex]);
			playersRemaining.splice(maxIndex, 1);
			if (playersRemaining.length === 0) {
				break;
			}
		}
	}

	playersRemaining.sort((a, b) => {
		const bOvr =
			b.ratings.pos === "RP" || b.ratings.pos === "SP"
				? b.ratings.ovrs.LF
				: b.ratings.ovrs[b.ratings.pos];
		const aOvr =
			a.ratings.pos === "RP" || a.ratings.pos === "SP"
				? a.ratings.ovrs.LF
				: a.ratings.ovrs[a.ratings.pos];
		const diff = bOvr - aOvr;
		if (diff === 0) {
			// Deterministic order
			return b.pid - a.pid;
		}
		return diff;
	});
	defensivePlayersSorted.push(...playersRemaining);

	// Try swappinng players to see if that improves the total ovr
	const numPlayersToTest =
		defensivePlayersSorted.length < 11 ? defensivePlayersSorted.length : 11;
	for (let numSwapTries = 0; numSwapTries < 5; numSwapTries++) {
		let swapped = false;

		const defPositionsShuffled = defPositions.map((pos, i) => ({
			pos,
			i,
		}));
		random.shuffle(defPositionsShuffled, g.get("season") + numSwapTries);

		for (const { i, pos } of defPositionsShuffled) {
			for (let j = 0; j < numPlayersToTest; j++) {
				if (i === j) {
					continue;
				}

				const p = defensivePlayersSorted[i];
				const p2 = defensivePlayersSorted[j];
				const pos2 = defPositions[j];

				// Needed for empty roster, like expansion draft
				if (!p || !p2) {
					continue;
				}

				if (
					p.ratings.ovrs[pos2] + p2.ratings.ovrs[pos] >
					p.ratings.ovrs[pos] + p2.ratings.ovrs[pos2]
				) {
					const temp: any = defensivePlayersSorted[i];
					defensivePlayersSorted[i] = defensivePlayersSorted[j];
					defensivePlayersSorted[j] = temp;
					swapped = true;
				}
			}
		}

		if (!swapped) {
			break;
		}
	}

	return defensivePlayersSorted.map(p => p.pid);
};

export const getDepthPitchers = (
	players: {
		pid: number;
		ratings: {
			ovrs: Record<string, number>;
		};
	}[],
) => {
	const pitchersSorted: number[] = [];

	let playersRemaining = [...players];

	const getTopByPos = (pos: "SP" | "RP", numToAdd: number) => {
		const pids = [];
		const indexes = new Set();
		const records = findMaxBy(playersRemaining, numToAdd, p => score(p, pos));
		for (const record of records) {
			pids.push(playersRemaining[record.index].pid);
			indexes.add(record.index);
		}

		// Can't use splice if there are multiple to remove
		playersRemaining = playersRemaining.filter((p, i) => !indexes.has(i));

		return pids;
	};

	// Top 3 starters
	pitchersSorted.push(...getTopByPos("SP", 3));

	// Closer
	const closer = getTopByPos("RP", 1)[0];

	// Remaining 2 starters
	pitchersSorted.push(...getTopByPos("SP", 2));

	// Everybody else
	if (closer !== undefined) {
		pitchersSorted.push(closer);
	}
	playersRemaining.sort((a, b) => {
		// Inlining this improves performance significantly, for some reason
		const diff = b.ratings.ovrs.RP - a.ratings.ovrs.RP;
		if (diff === 0) {
			// Deterministic order
			return b.pid - a.pid;
		}
		return diff;
	});
	pitchersSorted.push(...playersRemaining.map(p => p.pid));

	return pitchersSorted;
};

const genDepth = async (
	playersRaw: Player[],
	initialDepth: {
		L: number[];
		LP: number[];
		D: number[];
		DP: number[];
		P: number[];
	},
	onlyNewPlayers?: boolean,
	pos?: "L" | "LP" | "D" | "DP" | "P",
) => {
	if (initialDepth === undefined) {
		throw new Error("Missing depth");
	}
	const depth = helpers.deepCopy(initialDepth);

	let players: any[];

	// Can't use getCopies in exhibition game, and also want to ignore fuzz, so just keep these two code paths
	if (local.exhibitionGamePlayers) {
		players = playersRaw.map(p => {
			const ratings = p.ratings.at(-1)!;
			return {
				pid: p.pid,
				ratings: {
					spd: ratings.spd,
					pos: ratings.pos,
					ovrs: ratings.ovrs,
				},
			};
		});
	} else {
		players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: ["pid"],
			ratings: ["spd", "pos", "ovrs"],
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});
	}

	// Lineup last, since that depends on defensive starters
	const positions: (keyof typeof depth)[] = pos
		? [pos]
		: ["P", "D", "DP", "L", "LP"];

	for (const pos2 of positions) {
		if (onlyNewPlayers) {
			if (pos2 === "L" || pos2 === "LP") {
				continue;
			}

			// Identify players not currently in the depth chart, and add them to the depth chart above any player worse
			// than them without otherwise disturbing the order of the depth chart. This is useful for adding free agents to
			// the user's team - start them if they're better, but otherwise don't fuck with the user's depth chart.
			const playersNotInDepth = players.filter(
				p => !depth[pos2].includes(p.pid),
			);

			if (pos2 === "D" || pos2 === "DP") {
				const addToBench = [];

				const defPositions = pos2 === "D" ? DEF_POSITIONS_DH : DEF_POSITIONS;

				for (const p of playersNotInDepth) {
					let added = false;

					// Put in starting lineup if better than existing starter
					for (let i = 0; i < defPositions.length; i++) {
						const scorePos = defPositions[i];
						const pScore = score(p, scorePos);
						const p2 = players.find(p2 => p2.pid === depth[pos2][i]);
						if (!p2 || pScore > score(p2, scorePos)) {
							depth[pos2][i] = p.pid;
							added = true;

							if (p2) {
								addToBench.push(p2);
							}

							break;
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
					for (let i = defPositions.length; i < depth[pos2].length; i++) {
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

			if (pos2 === "LP" || pos2 === "L") {
				const depthDefense = depth[pos2 === "L" ? "D" : "DP"];
				const playersByPid = groupByUnique(players, "pid");

				const starters = depthDefense
					.slice(0, pos2 === "L" ? 9 : 8)
					.map((pid, i) => ({
						i,
						p: playersByPid[pid],
					}));

				const sortedStarters = orderBy(
					starters,
					info => lineupSort(info.p.ratings.ovrs.DH, info.p.ratings.spd),
					"desc",
				);

				const indexes = sortedStarters.map(info => info.i);

				if (pos2 === "LP") {
					// Pitcher last
					indexes.push(-1);
				}

				depth[pos2] = indexes;
			} else if (pos2 === "DP") {
				depth[pos2] = getDepthDefense(players, false);
			} else if (pos2 === "D") {
				depth[pos2] = getDepthDefense(players, true);
			} else if (pos2 === "P") {
				depth[pos2] = getDepthPitchers(players);
			}
		}
	}

	return depth;
};

export default genDepth;
