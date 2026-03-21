// UI-side connection to socialFeedDb — separate from the game worker's connection.
// IndexedDB allows multiple independent connections to the same database.
// This module must never import from src/worker/db/ or reference the worker's connection.

import { openDB } from "@dumbmatter/idb";
import type { SocialFeedDB } from "../../worker/util/feedDb.ts";
import type { GeneratedPost } from "../../common/types.feedEvent.ts";

let dbPromise: ReturnType<typeof openDB<SocialFeedDB>> | undefined;

function getDb() {
	if (!dbPromise) {
		dbPromise = openDB<SocialFeedDB>("socialFeedDb", 1, {
			blocked() {
				console.warn("socialFeedDb (UI): blocked by another tab");
			},
			blocking() {
				// A newer version wants to open — release our handle.
				dbPromise = undefined;
			},
		});
	}
	return dbPromise;
}

export async function getPosts(limit = 50): Promise<GeneratedPost[]> {
	const db = await getDb();
	const tx = db.transaction("posts", "readonly");
	const index = tx.store.index("by-time");
	const results: GeneratedPost[] = [];
	let cursor = await index.openCursor(null, "prev");
	while (cursor) {
		results.push(cursor.value);
		if (results.length >= limit) {
			break;
		}
		cursor = await cursor.continue();
	}
	await tx.done;
	return results;
}
