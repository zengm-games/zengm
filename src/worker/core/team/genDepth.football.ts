import { idb } from "../../db";
import { g, helpers, local } from "../../util";
import { POSITIONS } from "../../../common/constants.football";
import type { Position } from "../../../common/types.football";
import type { Player, PlayerFiltered } from "../../../common/types";

const score = (p: PlayerFiltered, pos: Position) => {
	let tempScore = p.ratings.ovrs[pos];

	if (p.ratings.pos === pos) {
		tempScore += 15;
	}

	return tempScore;
};

const genDepth = async (
	playersRaw: Player[],
	initialDepth: {
		QB: number[];
		RB: number[];
		WR: number[];
		TE: number[];
		OL: number[];
		DL: number[];
		LB: number[];
		CB: number[];
		S: number[];
		K: number[];
		P: number[];
		KR: number[];
		PR: number[];
	},
	onlyNewPlayers?: boolean,
	pos?: Position,
) => {
	if (initialDepth === undefined) {
		throw new Error("Missing depth");
	}
	const depth = helpers.deepCopy(initialDepth);

	let players;

	// Can't use getCopies in exhibition game, and also want to ignore fuzz, so just keep these two code paths
	if (local.exhibitionGamePlayers) {
		players = playersRaw.map(p => {
			const ratings = p.ratings.at(-1)!;
			return {
				pid: p.pid,
				ratings: {
					pos: ratings.pos,
					ovrs: ratings.ovrs,
				},
			};
		});
	} else {
		players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: ["pid"],
			ratings: ["pos", "ovrs"],
			season: g.get("season"),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});
	}
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

	return depth;
};

export default genDepth;
