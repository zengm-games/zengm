import { idb } from "../db/index.ts";

export const getNewLeagueLid = async () => {
	const cursor = await (
		await idb.meta.transaction("leagues")
	).store.openCursor(undefined, "prev");
	if (cursor) {
		return cursor.value.lid + 1;
	}

	return 1;
};
