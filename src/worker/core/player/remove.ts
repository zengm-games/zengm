import { idb } from "../../db/index.ts";
import { PLAYER } from "../../../common/constants.ts";
import type { Player } from "../../../common/types.ts";

const hasRelativeAndMutate = (p: Player, pids: Set<number>) => {
	if (!p.relatives) {
		return false;
	}

	const has = p.relatives.some((relative) => pids.has(relative.pid));
	if (has) {
		p.relatives = p.relatives.filter((relative) => !pids.has(relative.pid));
	}
	return has;
};

const remove = async (pids: number[]) => {
	if (pids.length === 0) {
		return;
	}

	for (const pid of pids) {
		await idb.cache.players.delete(pid);
	}

	const pidsSet = new Set(pids);

	// Also remove any relatives
	const players = await idb.cache.players.getAll();
	for (const p of players) {
		if (pidsSet.has(p.pid)) {
			continue;
		}

		if (hasRelativeAndMutate(p, pidsSet)) {
			await idb.cache.players.put(p);
		}
	}
	for await (const cursor of idb.league
		.transaction("players", "readwrite")
		.store.index("tid")
		.iterate(PLAYER.RETIRED)) {
		const p = cursor.value;
		if (pidsSet.has(p.pid)) {
			continue;
		}

		if (hasRelativeAndMutate(p, pidsSet)) {
			await cursor.update(p);
		}
	}
};

export default remove;
