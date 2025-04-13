import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";

const getName = async () => {
	const l = await idb.meta.get("leagues", g.get("lid"));
	if (l) {
		return l.name;
	}

	return "Unknown league";
};

export default getName;
