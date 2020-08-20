import { getAll, idb, iterate } from "..";
import { mergeByPk } from "./helpers";
import type { Message } from "../../../common/types";

const getLastEntries = <T>(arr: T[], limit: number): T[] => {
	return arr.slice(arr.length - limit);
};

const getCopies = async ({
	limit,
	mid,
}: {
	limit?: number;
	mid?: number;
} = {}): Promise<Message[]> => {
	if (mid !== undefined) {
		const message = await idb.cache.messages.get(mid);
		if (message) {
			return [message];
		}

		const message2 = await idb.league.get("messages", mid);
		if (message2) {
			return [message2];
		}

		return [];
	}

	if (limit !== undefined) {
		const fromDb: Message[] = [];
		await iterate(
			idb.league.transaction("messages").store,
			undefined,
			"prev",
			(message, shortCircuit) => {
				fromDb.unshift(message);
				if (fromDb.length >= limit) {
					shortCircuit();
				}
			},
		);

		const fromCache = await idb.cache.messages.getAll();

		const messages = mergeByPk(
			fromDb,
			getLastEntries(fromCache, limit),
			"messages",
		);

		// Need another getLastEntries because DB and cache will probably combine for (2 * limit) entries
		return getLastEntries(messages, limit);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("messages").store),
		await idb.cache.messages.getAll(),
		"messages",
	);
};

export default getCopies;
