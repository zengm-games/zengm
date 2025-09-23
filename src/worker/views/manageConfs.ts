import type { Conf, Div } from "../../common/types.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";

const updateConfs = async () => {
	const initialConfs: Conf[] = g.get("confs");
	const initialDivs: Div[] = g.get("divs");

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
	});

	return {
		actualPhase: g.get("nextPhase") ?? g.get("phase"),
		autoRelocate: !!g.get("autoRelocate"),
		initialConfs,
		initialDivs,
		initialTeams,
	};
};

export default updateConfs;
