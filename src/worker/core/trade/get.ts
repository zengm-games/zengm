import { idb } from "../../db/index.ts";

const get = async () => {
	const tr = await idb.cache.trade.get(0);
	if (!tr) {
		throw new Error("No trade found");
	}
	return tr;
};

export default get;
