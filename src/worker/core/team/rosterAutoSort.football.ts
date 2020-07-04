import { idb } from "../../db";
import { g } from "../../util";
import { POSITIONS } from "../../../common/constants.football";
import type { Position } from "../../../common/types.football";
import type { PlayerFiltered } from "../../../common/types";

const score = (p: PlayerFiltered, pos: Position) => {
	let tempScore = p.ratings.ovrs[pos];

	if (p.ratings.pos === pos) {
		tempScore += 15;
	}

	return tempScore;
};

const rosterAutoSort = async (
	tid: number,
	onlyNewPlayers?: boolean,
	pos?: Position,
) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}
	const depth = t.depth;

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
	const positions = pos ? [pos] : POSITIONS;

	for (const pos2 of positions) {
		if (onlyNewPlayers) {
			// Identify players not currently in the depth chart, and add them to the depth chart above any player worse
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
			}
		} else {
			// Sort everything from scratch
			players.sort((a, b) => {
				const diff = score(b, pos2) - score(a, pos2);
				if (diff === 0) {
					// Deterministic order
					return b.pid - a.pid;
				}
				return diff;
			});
			depth[pos2] = players.map(p => p.pid);
		}
	}

	await idb.cache.teams.put(t);
};

export default rosterAutoSort;
