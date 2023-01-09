import { groupBy } from "../../../common/groupBy";
import type { Relative } from "../../../common/types";
import type { Basketball } from "./loadData.basketball";

let allRelativesBySlug: Record<string, Basketball["relatives"]> | undefined;

// players: All players to add relatives to, and also all eligible players who may be relatives of other players. This is so leagues without all players don't get broken links.
// allRelatives: From real players data file, all possible relatives
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

	// Not groupByUnique because you could have two copies of the same player in a league, at least in 2022!
	const playersBySlug = groupBy(players, "srID");

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
			const playersTemp = playersBySlug[relative.slug2];
			if (playersTemp) {
				for (const p2 of playersTemp) {
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
		}

		if (relatives2.length > 0) {
			// Due to the possibility of having individual real teams in a random players league, addRelatives winds up being called a second time with just active players. In that case, merge the relatives lists.
			if (p.relatives) {
				const seenKeys = new Set();
				p.relatives = [...p.relatives, ...relatives2].filter(relative => {
					const key = JSON.stringify([
						relative.type,
						relative.pid,
						relative.name,
					]);

					if (seenKeys.has(key)) {
						return false;
					}

					seenKeys.add(key);
					return true;
				});
			} else {
				p.relatives = relatives2;
			}
		}
	}
};

export default addRelatives;
