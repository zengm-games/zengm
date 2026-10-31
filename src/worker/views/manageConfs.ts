import { actualPhase } from "../util/actualPhase.ts";
import { g } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { team } from "../core/index.ts";

export default defineView({
	id: "manageConfs",
	load: async () => {
		const initialConfs = g.get("confs");
		const initialDivs = g.get("divs");

		const initialTeams = await team.getFormattedAll({
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
			actualPhase: actualPhase(),
			autoRelocate: !!g.get("autoRelocate"),
			initialConfs,
			initialDivs,
			initialTeams,
		};
	},
});
