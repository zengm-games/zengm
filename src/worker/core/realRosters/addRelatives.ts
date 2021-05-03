import { groupBy, groupByUnique } from "../../../common/groupBy";
import type { Relative } from "../../../common/types";
import type { Basketball } from "./loadData.basketball";

let allRelativesBySlug: Record<string, Basketball["relatives"]> | undefined;

const addRelatives = (
	players: {
		name: string;
		pid: number;
		srID: string;
		relatives?: Relative[];
	}[],
	allRelatives: Basketball["relatives"],
) => {
	if (!allRelativesBySlug) {
		allRelativesBySlug = groupBy(allRelatives, "slug");
	}

	const playersBySlug = groupByUnique(players, "srID");

	for (const p of players) {
		const relatives = allRelativesBySlug[p.srID];
		if (!relatives) {
			continue;
		}

		const relatives2 = [];
		for (const relative of relatives) {
			const p2 = playersBySlug[relative.slug2];
			if (p2) {
				relatives2.push({
					type: relative.type,
					name: p2.name,
					pid: p2.pid,
				});
			}
		}

		if (relatives2.length > 0) {
			p.relatives = relatives2;
		}
	}
};

export default addRelatives;
