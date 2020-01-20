import { getAll, idb } from "..";
import { mergeByPk } from "./helpers";
import { Message } from "../../../common/types";

const getLastEntries = <T extends any>(arr: T[], limit: number): T[] => {
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
			return [message];
		}

		return [];
	}

	const constLimit = limit; // For flow

	if (constLimit !== undefined) {
		const fromDb: Message[] = [];
		await idb.league.messages.iterate(
			undefined,
			"prev",
			(message: Message, shortCircuit) => {
				fromDb.unshift(message);

				if (fromDb.length >= constLimit) {
					shortCircuit();
				}
			},
		);
		const fromCache = await idb.cache.messages.getAll();
		const messages = mergeByPk(
			fromDb,
			getLastEntries(fromCache, constLimit),
			idb.cache.storeInfos.messages.pk,
		);

		// Need another getLastEntries because DB and cache will probably combine for (2 * limit) entries
		return getLastEntries(messages, constLimit);
	}

	return mergeByPk(
		await getAll(idb.league.transaction("messages").store),
		await idb.cache.messages.getAll(),
		idb.cache.storeInfos.messages.pk,
	);
};

export default getCopies;
