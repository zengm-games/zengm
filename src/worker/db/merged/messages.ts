import type { Message } from "../../../common/types.ts";
import { idb } from "../index.ts";
import { getAll, MergedStore, type GetAllOptions } from "./engine.ts";

export type MessagesSelector = {
	// Only the most recent messages
	limit: number;
};

// Newest to oldest, stopping once enough messages are read. Some messages in the cache might be more recent, but there's no need to read more than this from IndexedDB.
async function* newestFromDb(limit: number) {
	// Messages deleted from the cache but not yet from IndexedDB will be skipped, so read extra to make up for them
	const numToRead = limit + idb.cache.messages.numPendingDeletes();

	let numRead = 0;
	for await (const cursor of idb.league
		.transaction("messages")
		.store.iterate(undefined, "prev")) {
		yield cursor;

		numRead += 1;
		if (numRead >= numToRead) {
			break;
		}
	}
}

class MessagesStore extends MergedStore<"messages", MessagesSelector> {
	override async getAll<Output = Message>(
		selector?: MessagesSelector,
		options: GetAllOptions<Message, Output> = {},
	): Promise<Output[]> {
		if (selector === undefined) {
			return super.getAll(undefined, options);
		}

		// With limit, filter is not allowed, because it would be unclear if it applies before or after finding the most recent messages
		const { filter, map } = options;
		if (filter) {
			throw new Error("filter is not allowed with limit");
		}

		const { limit } = selector;

		// Otherwise slice(-0) below would return every message
		if (limit <= 0) {
			return [];
		}

		const messages = await getAll("messages", {
			fromDb: () => newestFromDb(limit),
		});

		// Sorted from oldest to newest
		return messages
			.sort((a, b) => a.mid - b.mid)
			.slice(-limit)
			.map((message) => {
				// With no map function, Output is Message
				return map ? map(message) : (message as unknown as Output);
			});
	}
}

export default new MessagesStore("messages", { small: true });
