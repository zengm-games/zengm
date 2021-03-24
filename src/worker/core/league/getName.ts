import { idb } from "../../db";
import { g } from "../../util";

const getName = async () => {
	const l = await idb.meta.get("leagues", g.get("lid"));
	if (l) {
		return l.name;
	}

	return "Unknown league";
};

export default getName;
