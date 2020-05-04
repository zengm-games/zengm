import { idb } from "../db";
import { g } from "../util";

const updateConfs = async () => {
	const confs = g.get("confs", Infinity);
	const divs = g.get("divs", Infinity);

	return {
		confs,
		divs,
		godMode: g.get("godMode"),
	};
};

export default updateConfs;
