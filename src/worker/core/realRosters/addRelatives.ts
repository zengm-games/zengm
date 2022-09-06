import { groupBy, groupByUnique } from "../../../common/groupBy";
import type { Relative } from "../../../common/types";
import type { Basketball } from "./loadData.basketball";

let allRelativesBySlug: Record<string, Basketball["relatives"]> | undefined;

const addRelatives = (
	players: (
		| {
				name: string;
				pid: number;
				srID?: string;
				relatives?: Relative[];
		  }
		| {
				firstName: string;
				lastName: string;
				pid: number;
				srID?: string;
				relatives?: Relative[];
		  }
	)[],
	allRelatives: Basketball["relatives"],
) => {
	if (!allRelativesBySlug) {
		allRelativesBySlug = groupBy(allRelatives, "slug");
	}

	const playersBySlug = groupByUnique(
		players.filter(p => p.srID !== undefined),
		"srID",
	);

	for (const p of players) {
		if (p.srID === undefined) {
			continue;
		}

		const relatives = allRelativesBySlug[p.srID];
		if (!relatives) {
			continue;
		}

		const relatives2 = [];
		for (const relative of relatives) {
			const p2 = playersBySlug[relative.slug2];
			if (p2) {
				const name =
					(p2 as any).name ??
					`${(p2 as any).firstName} ${(p2 as any).lastName}`;
				relatives2.push({
					type: relative.type,
					name,
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
