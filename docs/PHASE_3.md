# Phase 3: socialFeedDb

## Contract

Accounts, posts, and threads can be written to and read from `socialFeedDb` without touching or depending on the league's IndexedDB. Posts are queryable by `agentId` (for profile pages) and by `createdAt` (for the main feed). Accounts are queryable by `pid`, `tid`, and `type` via dedicated indexes. `putAccount` is exported for unconditional upsert of an `Account` record into the `accounts` store. The schema is stable — no migration will be needed within v1.

## Depends on

- Phase 1 (`src/common/types.feedEvent.ts`) — `Account`, `GeneratedPost`, `ThreadRecord` types

## Delivers

- `src/ui/db/socialFeedDb.ts`

Exported functions: `getSocialFeedDb`, `addAccount`, `putAccount`, `getAccount`, `getAccountByPid`, `getAccountByTid`, `getAccountsByType`, `getAllAccounts`, `updateAccountStatus`, `addPost`, `getPosts`, `getPostsByAgent`, `addThread`, `getThread`, `clearFeed`.

## Schema

The database is opened with `openDB` from `@dumbmatter/idb` (the same library used by the league IDB). Database name: `"socialFeedDb"`, version `1`.

```typescript
import { openDB } from "@dumbmatter/idb";
import type { DBSchema, IDBPDatabase } from "@dumbmatter/idb";
import type {
	Account,
	GeneratedPost,
	ThreadRecord,
} from "../../common/types.feedEvent.ts";

// ISOLATION CONSTRAINT: This file must never import from src/worker/db/ or
// reference idb.league. socialFeedDb is a completely separate IndexedDB database.

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

export function getSocialFeedDb() {
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
```

**Three object stores:**

| Store      | Key                 | Indexes                                                   |
| ---------- | ------------------- | --------------------------------------------------------- |
| `accounts` | `agentId` (string)  | `by-pid` on `pid`, `by-tid` on `tid`, `by-type` on `type` |
| `posts`    | `postId` (string)   | `by-agent` on `agentId`, `by-time` on `createdAt`         |
| `threads`  | `threadId` (string) | —                                                         |

## API

Full TypeScript implementation of every exported function:

```typescript
// ─── Accounts ────────────────────────────────────────────────────────────────

export async function addAccount(account: Account): Promise<void> {
	const db = await getSocialFeedDb();
	await db.put("accounts", account);
}

// putAccount is the canonical upsert for the accounts store. It writes (or overwrites) an
// Account record unconditionally, unlike addAccount which is semantically "insert on first seed".
// Phase 3a and any other phase that needs to update an existing account must use putAccount.
export async function putAccount(account: Account): Promise<void> {
	const db = await getSocialFeedDb();
	await db.put("accounts", account);
}

export async function getAccount(
	agentId: string,
): Promise<Account | undefined> {
	const db = await getSocialFeedDb();
	return db.get("accounts", agentId);
}

export async function getAccountByPid(
	pid: number,
): Promise<Account | undefined> {
	// Uses the by-pid index — not a full store scan.
	const db = await getSocialFeedDb();
	return db.getFromIndex("accounts", "by-pid", pid);
}

export async function getAccountByTid(
	tid: number,
): Promise<Account | undefined> {
	// Uses the by-tid index — not a full store scan.
	const db = await getSocialFeedDb();
	return db.getFromIndex("accounts", "by-tid", tid);
}

export async function getAccountsByType(
	type: Account["type"],
): Promise<Account[]> {
	// Uses the by-type index — returns all accounts of a given type without a full store scan.
	// Example: getAccountsByType("fan") returns all fan accounts.
	const db = await getSocialFeedDb();
	return db.getAllFromIndex("accounts", "by-type", type);
}

export async function getAllAccounts(): Promise<Account[]> {
	const db = await getSocialFeedDb();
	return db.getAll("accounts");
}

export async function updateAccountStatus(
	agentId: string,
	status: "active" | "dormant",
): Promise<void> {
	const db = await getSocialFeedDb();
	const tx = db.transaction("accounts", "readwrite");
	const account = await tx.store.get(agentId);
	if (account) {
		account.status = status;
		await tx.store.put(account);
	}
	await tx.done;
}

// ─── Posts ────────────────────────────────────────────────────────────────────

export async function addPost(post: GeneratedPost): Promise<void> {
	const db = await getSocialFeedDb();
	await db.put("posts", post);
}

export async function getPosts(limit?: number): Promise<GeneratedPost[]> {
	// Returns posts newest-first using the by-time index with direction "prev".
	const db = await getSocialFeedDb();
	const tx = db.transaction("posts", "readonly");
	const index = tx.store.index("by-time");
	const results: GeneratedPost[] = [];
	let cursor = await index.openCursor(null, "prev");
	while (cursor) {
		results.push(cursor.value);
		if (limit !== undefined && results.length >= limit) break;
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
	const db = await getSocialFeedDb();
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
		if (results.length >= limit) break;
		cursor = await cursor.continue();
	}
	await tx.done;
	return results;
}

// ─── Threads ──────────────────────────────────────────────────────────────────

export async function addThread(thread: ThreadRecord): Promise<void> {
	const db = await getSocialFeedDb();
	await db.put("threads", thread);
}

export async function getThread(
	threadId: string,
): Promise<ThreadRecord | undefined> {
	const db = await getSocialFeedDb();
	return db.get("threads", threadId);
}

// ─── Maintenance ──────────────────────────────────────────────────────────────

export async function clearFeed(): Promise<void> {
	// Clears posts and threads only. The accounts store is intentionally left intact.
	const db = await getSocialFeedDb();
	const tx = db.transaction(["posts", "threads"], "readwrite");
	await Promise.all([
		tx.objectStore("posts").clear(),
		tx.objectStore("threads").clear(),
	]);
	await tx.done;
}
```

## Implementation Notes

### @dumbmatter/idb usage

`@dumbmatter/idb` is a thin TypeScript wrapper over the native IndexedDB API. It is already used by the game engine (`src/worker/db/`). The `openDB` function accepts a typed `DBSchema` interface; all store operations are fully typed at compile time. This file uses the same `openDB` import path as the league IDB but opens a completely separate database.

### Singleton pattern

`dbPromise` is a module-level variable holding the promise returned by `openDB`. The first call to `getSocialFeedDb()` creates the promise; subsequent calls return the same promise. This means the database is opened at most once per page load, even if multiple components call helpers concurrently. The `blocking()` callback nulls out `dbPromise` so a future open (e.g. after a version bump) starts fresh.

### Index design — posts store

Two indexes are created on the `posts` store:

- `by-agent` on `agentId` — `getPostsByAgent` calls `getAllFromIndex("posts", "by-agent", agentId)` or opens a cursor over `IDBKeyRange.only(agentId)`. This is an index lookup, not a full-store scan. Callers must never substitute a `.getAll()` + `.filter()` pattern.
- `by-time` on `createdAt` — `getPosts` opens a cursor with direction `"prev"` (descending by `createdAt`) to deliver newest posts first. A plain `.getAll()` would return posts in insertion order, not time order.

### Index design — accounts store

Three indexes are created on the `accounts` store:

- `by-pid` on `pid` — `getAccountByPid` calls `getFromIndex("accounts", "by-pid", pid)`.
- `by-tid` on `tid` — `getAccountByTid` calls `getFromIndex("accounts", "by-tid", tid)`.
- `by-type` on `type` — `getAccountsByType` calls `getAllFromIndex("accounts", "by-type", type)`. This enables efficient bulk retrieval of all accounts of a given type (e.g. all `"fan"` accounts, all `"org"` accounts) without scanning the full store.

Journalist and fan accounts have `pid: null` and `tid: null`. The IDB specification states that entries with a key of `null` or `undefined` are not included in the index — they are simply omitted. This is the correct behavior: `getAccountByPid(null)` is never called; callers always pass a concrete number. No special handling is required in the upgrade callback.

The `by-type` index always has a concrete string value (`"player"`, `"org"`, `"journalist"`, or `"fan"`), so every account appears in that index.

### null vs undefined

All nullable fields in `Account` and `GeneratedPost` are typed as `T | null`, never `T | undefined`. IDB's structured-clone algorithm preserves `null` faithfully but drops `undefined` object properties entirely. A `GeneratedPost` with `imageUrl: null` stored and re-read will have `imageUrl === null`, not `imageUrl === undefined` and not a missing key. Because the Phase 1 types already enforce `T | null`, no defensive conversion is needed at the DB layer.

### Free agent `tid` convention

When a player is a free agent, `Account.tid` must be set to `-1` — not `null`. This matches ZenGM's internal convention where `tid === -1` means "free agent" (unsigned, not on any team roster). Setting `tid: null` for free agents would cause the account to be silently excluded from the `by-tid` index, which is the correct behavior for non-players, but for player accounts `tid` must always be a number so that the value round-trips correctly and downstream code can check `account.tid === -1` to detect the free-agent state.

Summary: player accounts always have a numeric `tid` (`-1` for free agents, a non-negative integer for rostered players). Non-player accounts (journalist, fan, org without a specific player link) set `tid: null`.

### clearFeed isolation

`clearFeed()` opens a single transaction over `["posts", "threads"]` and calls `.clear()` on each. The `accounts` store is not included in the transaction and is never modified. This is enforced structurally: the transaction type list is `["posts", "threads"]`, so any attempt to touch `accounts` inside the same transaction would be a TypeScript error.

### League IDB isolation

This file lives in `src/ui/db/` and must never import from `src/worker/db/` or reference `idb.league`. The league IDB is owned by the game Worker; the UI thread has no direct access. The isolation comment at the top of the file documents this constraint for future contributors. A CI lint rule or import boundary check (e.g. eslint-plugin-import `no-restricted-paths`) can enforce it automatically.

### Opening without an active league

`getSocialFeedDb()` opens `"socialFeedDb"` by name — it has no dependency on a league ID or any game state. Calling it before a league is loaded, after a league is closed, or from a cold page load (e.g. a standalone feed widget) does not throw. The database exists independently of any league database.

## Verified by

- `addPost` followed by `getPosts` returns the same post with all fields intact
- `getPostsByAgent("player_42")` returns only posts where `agentId === "player_42"` — confirmed via `by-agent` index, not a full-store scan
- `getAccountByPid(42)` returns the account for player 42 — confirmed by `by-pid` index lookup, not a filter
- `getAccountByTid(5)` returns the account for team 5 — confirmed by `by-tid` index lookup
- `clearFeed()` empties `posts` and `threads` but leaves all accounts untouched; `getAllAccounts()` returns the same count before and after
- No operation in this file imports or touches the league IDB — `idb.league` is never referenced; no import from `src/worker/db/` exists
- A `GeneratedPost` with `imageUrl: null` round-trips as `null`, not `undefined`; confirmed by strict equality check after `getPosts()`
- Opening `socialFeedDb` when no league is active does not throw; `getSocialFeedDb()` resolves to a valid `IDBPDatabase`
- `getPosts(10)` returns at most 10 posts, ordered newest-first by `createdAt`
- `tsc --noEmit` on `socialFeedDb.ts` passes with zero errors

## Definition of Done

One file at `src/ui/db/socialFeedDb.ts`. Zero imports from `src/worker/db/`. Zero `any`. Compiles clean. All exported helpers work (`getSocialFeedDb`, `addAccount`, `putAccount`, `getAccount`, `getAccountByPid`, `getAccountByTid`, `getAccountsByType`, `getAllAccounts`, `updateAccountStatus`, `addPost`, `getPosts`, `getPostsByAgent`, `addThread`, `getThread`, `clearFeed`). Profile page queries use indexes. `by-type` index present on the `accounts` store. `clearFeed` leaves accounts untouched. League DB provably not referenced.
