import { idb } from "../db";

const getNewLeagueLid = async () => {
	const cursor = await idb.meta
		.transaction("leagues")
		.store.openCursor(undefined, "prev");
	if (cursor) {
		return cursor.value.lid + 1;
	}

	return 1;
};

export default getNewLeagueLid;
