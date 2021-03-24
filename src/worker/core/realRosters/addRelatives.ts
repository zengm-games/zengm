import type { Relative } from "../../../common/types";
import type { Basketball } from "./loadData.basketball";

const addRelatives = (
	players: {
		name: string;
		pid: number;
		srID: string;
		relatives?: Relative[];
	}[],
	allRelatives: Basketball["relatives"],
) => {
	for (const p of players) {
		const relatives = allRelatives.filter(row => row.slug === p.srID);

		const relatives2 = [];
		for (const relative of relatives) {
			const p2 = players.find(p2 => relative.slug2 === p2.srID);
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
