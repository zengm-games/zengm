import type { Message } from "../../../common/types.ts";
import { idb } from "../index.ts";
import {
	get,
	getAll,
	type GetAllOptions,
	type GetOptions,
	type Query,
} from "./engine.ts";

export type MessagesSelector = {
	// Only the most recent messages
	limit: number;
};

const toQuery = ({ limit }: MessagesSelector): Query<Message> => {
	return {
		// Emit messages from newest to oldest, until enough of them are kept. Some other messages in the cache might be more recent, but there's no need to read more than this from IndexedDB.
		fromDb: async (emit) => {
			if (limit <= 0) {
				return;
			}

			let numKept = 0;
			for await (const { value } of idb.league
				.transaction("messages")
				.store.iterate(undefined, "prev")) {
				if (emit(value)) {
					numKept += 1;
					if (numKept >= limit) {
						break;
					}
				}
			}
		},
	};
};

export default {
	get: (mid: number, options?: GetOptions) => get("messages", mid, options),

	// Sorted from oldest to newest when using limit
	getAll: async <Output = Message>(
		selector?: MessagesSelector,
		options: GetAllOptions<Message, Output> = {},
	): Promise<Output[]> => {
		if (selector === undefined) {
			return getAll("messages", undefined, options);
		}

		// Need mid to find the most recent ones after merging the cache and IndexedDB
		const { copy, filter, map } = options;
		const rows = await getAll("messages", toQuery(selector), {
			copy,
			filter,
			map: (message) => ({
				mid: message.mid,

				// With no map function, Output is Message
				output: map ? map(message) : (message as unknown as Output),
			}),
		});

		return rows
			.sort((a, b) => a.mid - b.mid)
			.slice(-selector.limit)
			.map((row) => row.output);
	},
};
