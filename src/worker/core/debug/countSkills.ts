import { PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";

const countSkills = async () => {
	// All non-retired players
	const players = await idb.league
		.transaction("players")
		.store.index("tid")
		.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT));
	const counts: Record<string, number> = {};

	for (const p of players) {
		const r = p.ratings.at(-1); // Dynamically recompute, to make dev easier when changing skills formula

		const skills = player.skills(r);

		for (const skill of skills) {
			if (!counts.hasOwnProperty(skill)) {
				counts[skill] = 0;
			}
			counts[skill] += 1;
		}
	}

	console.table(counts);
};

export default countSkills;
