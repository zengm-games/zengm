import { PLAYER } from "../../../common/index.ts";
import { player } from "../index.ts";
import { idb } from "../../db/index.ts";

const countSkills = async () => {
	// All non-retired players
	const players = await idb.league
		.transaction("players")
		.store.index("tid")
		.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT));
	const counts: Record<string, number> = {};

	for (const p of players) {
		const r = p.ratings.at(-1)!;

		// Dynamically recompute, to make dev easier when changing skills formula
		const skills = player.skills(r);

		for (const skill of skills) {
			if (counts[skill] === undefined) {
				counts[skill] = 0;
			}
			counts[skill] += 1;
		}
	}

	console.table(counts);
};

export default countSkills;
