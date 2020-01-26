import { idb } from "../../db";
import { g } from "../../util";

const percentageDraftPicksSigned = async () => {
	const players = await idb.getCopies.players();

	const counts: {
		[key: string]: {
			signed: number;
			total: number;
		};
	} = {};
	for (let round = 1; round <= g.get("numDraftRounds"); round++) {
		for (let pick = 1; pick <= g.get("numTeams"); pick++) {
			counts[`${round}-${pick}`] = {
				signed: 0,
				total: 0,
			};
		}
	}

	for (const p of players) {
		if (
			p.draft.round >= 1 &&
			p.draft.pick >= 1 &&
			p.draft.year >= g.get("startingSeason")
		) {
			const key = `${p.draft.round}-${p.draft.pick}`;
			counts[key].total += 1;
			if (p.stats.length > 0 && p.draft.tid === p.stats[0].tid) {
				counts[key].signed += 1;
			}
		}
	}

	const table: Record<keyof typeof counts, number> = {};
	for (const [key, value] of Object.entries(counts)) {
		table[key] = value.signed / value.total;
	}

	console.table(table);
};

export default percentageDraftPicksSigned;
