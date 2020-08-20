import { PLAYER } from "../../../common";
import { player } from "..";
import { idb } from "../../db";

const countSkills = async () => {
	// All non-retired players
	const players = await idb.league
		.transaction("players")
		.store.index("tid")
		.getAll(IDBKeyRange.lowerBound(PLAYER.FREE_AGENT));
	const counts = {
		"3": 0,
		A: 0,
		B: 0,
		Di: 0,
		Dp: 0,
		Po: 0,
		Ps: 0,
		R: 0,
	};

	for (const p of players) {
		const r = p.ratings[p.ratings.length - 1]; // Dynamically recompute, to make dev easier when changing skills formula

		const skills = player.skills(r);

		for (const skill of skills) {
			if (counts.hasOwnProperty(skill)) {
				// https://github.com/microsoft/TypeScript/issues/21732
				// @ts-ignore
				counts[skill] += 1;
			}
		}
	}

	console.table(counts);
};

export default countSkills;
