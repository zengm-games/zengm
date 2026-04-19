import { idb } from "../../db/index.ts";

const cancel = async (pid: number) => {
	await idb.cache.negotiations.delete(pid);
};

export default cancel;
