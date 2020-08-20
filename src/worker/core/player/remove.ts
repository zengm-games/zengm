import { idb, iterate } from "../../db";
import { PLAYER } from "../../../common";
import type { Player } from "../../../common/types";

const hasRelativeAndMutate = (p: Player, pids: number[]) => {
	if (!p.relatives) {
		return false;
	}

	const has = p.relatives.some(relative => pids.includes(relative.pid));
	if (has) {
		p.relatives = p.relatives.filter(relative => !pids.includes(relative.pid));
	}
	return has;
};

const remove = async (pids: number[]) => {
	for (const pid of pids) {
		await idb.cache.players.delete(pid);
	}

	// Also remove any relatives
	const players = await idb.cache.players.getAll();
	for (const p of players) {
		if (pids.includes(p.pid)) {
			continue;
		}

		if (hasRelativeAndMutate(p, pids)) {
			await idb.cache.players.put(p);
		}
	}
	await iterate(
		idb.league.transaction("players", "readwrite").store.index("tid"),
		PLAYER.RETIRED,
		undefined,
		p => {
			if (pids.includes(p.pid)) {
				return;
			}

			if (hasRelativeAndMutate(p, pids)) {
				return p;
			}
		},
	);
};

export default remove;
