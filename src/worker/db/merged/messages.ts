import type { Message } from "../../../common/types.ts";
import { helpers } from "../../util/index.ts";
import { idb } from "../index.ts";
import {
	getAll,
	MergedStore,
	type GetAllOptions,
	type GetOptions,
} from "./engine.ts";

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

// With limit, filter is not allowed, because it would be unclear if it applies before or after finding the most recent messages
type LimitOptions<Output> = GetOptions & {
	filter?: never;
	map?: (message: Message) => Output;
};

class MessagesStore extends MergedStore<"messages", MessagesSelector> {
	override getAll<Output = Message>(
		selector?: undefined,
		options?: GetAllOptions<Message, Output>,
	): Promise<Output[]>;
	override getAll<Output = Message>(
		selector: MessagesSelector,
		options?: LimitOptions<Output>,
	): Promise<Output[]>;
	override async getAll<Output>(
		selector?: MessagesSelector,
		options: GetAllOptions<Message, Output> = {},
	): Promise<Output[]> {
		if (selector === undefined) {
			return super.getAll(undefined, options);
		}

		const { copy, filter, map } = options;
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
				// Rows from IndexedDB don't need to be copied, but it doesn't hurt to copy them too, since there are only a few
				const message2 = copy ? helpers.deepCopy(message) : message;

				// With no map function, Output is Message
				return map ? map(message2) : (message2 as unknown as Output);
			});
	}
}

export default new MessagesStore("messages");
