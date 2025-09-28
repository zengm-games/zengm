import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";

const updateConfs = async () => {
	const initialConfs = g.get("confs");
	const initialDivs = g.get("divs");

	const initialTeams = await idb.getCopies.teamsPlus({
		attrs: [
			"abbrev",
			"region",
			"name",
			"pop",
			"tid",
			"cid",
			"did",
			"imgURL",
			"imgURLSmall",
			"stadiumCapacity",
			"jersey",
			"colors",
		],
		active: true,
	});

	// Account for invalid divs, if they somehow exist - is this necessary??
	/*const divsByDid = groupByUnique(initialDivs, "did");
	for (const t of initialTeams) {
		const div = divsByDid[t.did];
		if (!div) {
			const newDiv = initialDivs.at(-1)!;
			t.did = newDiv.did;
			t.cid = newDiv.cid;
		} else {
			t.cid = div.cid;
		}
	}*/

	return {
		actualPhase: g.get("nextPhase") ?? g.get("phase"),
		autoRelocate: !!g.get("autoRelocate"),
		initialConfs,
		initialDivs,
		initialTeams,
	};
};

export default updateConfs;
