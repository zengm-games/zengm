// ISOLATION CONSTRAINT: This file must never import from src/worker/db/ or
// reference idb.league. feedDb is a completely separate IndexedDB database.

import { openDB } from "@dumbmatter/idb";
import type { DBSchema, IDBPDatabase } from "@dumbmatter/idb";
import type {
	Account,
	GeneratedPost,
	ThreadRecord,
} from "../../common/types.feedEvent.ts";

export interface SocialFeedDB extends DBSchema {
	accounts: {
		key: string; // agentId
		value: Account;
		indexes: {
			"by-pid": number; // Account.pid — for player profile lookups
			"by-tid": number; // Account.tid — for org profile lookups
			"by-type": string; // Account.type — for bulk lookup by account type (e.g. all "fan" accounts)
		};
	};
	posts: {
		key: string; // postId
		value: GeneratedPost;
		indexes: {
			"by-agent": string; // GeneratedPost.agentId — for profile page queries
			"by-time": number; // GeneratedPost.createdAt — for main feed (newest first)
		};
	};
	threads: {
		key: string; // threadId
		value: ThreadRecord;
	};
}

function createStores(db: IDBPDatabase<SocialFeedDB>) {
	// accounts store — keyed by agentId
	const accountsStore = db.createObjectStore("accounts", {
		keyPath: "agentId",
	});
	// by-pid and by-tid indexes may contain null values (journalist/fan accounts).
	// IDB silently skips null-keyed entries in indexes, so null-pid/null-tid accounts
	// are stored correctly but simply do not appear in the index — no error is thrown.
	accountsStore.createIndex("by-pid", "pid");
	accountsStore.createIndex("by-tid", "tid");
	// by-type index on the type field — allows efficient lookup of all accounts of a given type
	// (e.g. getAllFromIndex("accounts", "by-type", "fan") returns all fan accounts without a full scan).
	accountsStore.createIndex("by-type", "type");

	// posts store — keyed by postId
	const postsStore = db.createObjectStore("posts", { keyPath: "postId" });
	postsStore.createIndex("by-agent", "agentId");
	postsStore.createIndex("by-time", "createdAt");

	// threads store — keyed by threadId
	db.createObjectStore("threads", { keyPath: "threadId" });
}

// Module-level singleton — opened once, reused for all subsequent calls.
let dbPromise: ReturnType<typeof openDB<SocialFeedDB>> | null = null;

export function openFeedDb() {
	if (!dbPromise) {
		dbPromise = openDB<SocialFeedDB>("socialFeedDb", 1, {
			upgrade(db, oldVersion) {
				if (oldVersion === 0) {
					createStores(db);
				}
				// No migrations needed within v1. Future versions add cases here.
			},
			blocked() {
				console.warn("socialFeedDb: blocked by another tab");
			},
			blocking() {
				// A newer version wants to open — release our handle.
				dbPromise = null;
			},
		});
	}
	return dbPromise;
}

// ─── Accounts ────────────────────────────────────────────────────────────────

export async function putAccount(account: Account): Promise<void> {
	const db = await openFeedDb();
	await db.put("accounts", account);
}

export async function getAccount(
	agentId: string,
): Promise<Account | undefined> {
	const db = await openFeedDb();
	return db.get("accounts", agentId);
}

export async function getAccountByPid(
	pid: number,
): Promise<Account | undefined> {
	// Uses the by-pid index — not a full store scan.
	const db = await openFeedDb();
	return db.getFromIndex("accounts", "by-pid", pid);
}

export async function getAccountByTid(
	tid: number,
): Promise<Account | undefined> {
	// Uses the by-tid index — not a full store scan.
	const db = await openFeedDb();
	return db.getFromIndex("accounts", "by-tid", tid);
}

export async function getAccountsByType(
	type: Account["type"],
): Promise<Account[]> {
	// Uses the by-type index — returns all accounts of a given type without a full store scan.
	// Example: getAccountsByType("fan") returns all fan accounts.
	const db = await openFeedDb();
	return db.getAllFromIndex("accounts", "by-type", type);
}

export async function getAllAccounts(): Promise<Account[]> {
	const db = await openFeedDb();
	return db.getAll("accounts");
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function addPost(post: GeneratedPost): Promise<void> {
	const db = await openFeedDb();
	await db.put("posts", post);
}

export async function getPosts(limit?: number): Promise<GeneratedPost[]> {
	// Returns posts newest-first using the by-time index with direction "prev".
	const db = await openFeedDb();
	const tx = db.transaction("posts", "readonly");
	const index = tx.store.index("by-time");
	const results: GeneratedPost[] = [];
	let cursor = await index.openCursor(null, "prev");
	while (cursor) {
		results.push(cursor.value);
		if (limit !== undefined && results.length >= limit) {
			break;
		}
		cursor = await cursor.continue();
	}
	await tx.done;
	return results;
}

export async function getPostsByAgent(
	agentId: string,
	limit?: number,
): Promise<GeneratedPost[]> {
	// Uses the by-agent index — NOT a full store scan + filter.
	const db = await openFeedDb();
	if (limit === undefined) {
		return db.getAllFromIndex("posts", "by-agent", agentId);
	}
	// With a limit, open a cursor over the index key range for this agentId.
	const tx = db.transaction("posts", "readonly");
	const index = tx.store.index("by-agent");
	const results: GeneratedPost[] = [];
	let cursor = await index.openCursor(IDBKeyRange.only(agentId));
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

// ─── Threads ──────────────────────────────────────────────────────────────────

export async function addThread(thread: ThreadRecord): Promise<void> {
	const db = await openFeedDb();
	await db.put("threads", thread);
}

export async function getThread(
	threadId: string,
): Promise<ThreadRecord | undefined> {
	const db = await openFeedDb();
	return db.get("threads", threadId);
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export async function clearFeed(): Promise<void> {
	// Clears posts and threads only. The accounts store is intentionally left intact.
	const db = await openFeedDb();
	const tx = db.transaction(["posts", "threads"], "readwrite");
	await Promise.all([
		tx.objectStore("posts").clear(),
		tx.objectStore("threads").clear(),
	]);
	await tx.done;
}
