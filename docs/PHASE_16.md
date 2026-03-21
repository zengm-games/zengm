# Phase 16: Feed Worker → IDB Write + UI Notify

## Contract

After receiving `GeneratedPost[]` from Vercel, the Feed Worker writes every post to `socialFeedDb` and sends a `postsReady` message back to the UI main thread. The UI notification fires only after all `addPost` calls have resolved — never before. The main thread is not involved in any IDB write.

## Depends on

- **Phase 15** — `src/ui/workers/feedWorker.ts` already fetches from `/api/feed` and holds a resolved `GeneratedPost[]` array after a successful response
- **Phase 3** — `src/ui/db/socialFeedDb.ts` exports `addPost(post: GeneratedPost): Promise<void>`; the helper is callable from any context that can open IndexedDB, including a Web Worker

## Delivers

- Updated `src/ui/workers/feedWorker.ts` — the write + notify block that replaces the Phase 15 placeholder comment

No new files. No changes to `socialFeedDb.ts`. No changes to any UI component — the panel's `postsReady` listener is wired in Phase 18.

## Write Strategy

### Parallel writes via `Promise.all`

```typescript
await Promise.all(posts.map((post) => addPost(post)));
```

Each `addPost` call opens a single `put` transaction on the `posts` store. These transactions are independent — no post references another post at write time, and IDB allows concurrent read-write transactions on the same store. Running them in parallel reduces total write time from `O(n * latency)` to approximately `O(latency)`.

**Why not sequential?**

Sequential writes (`for...of` with `await`) would work correctly, but they serialize transactions unnecessarily. With `Promise.all`, all transactions are submitted to the IDB engine at once. For typical batch sizes (2–8 posts per event), the difference is small in absolute time, but parallel is the correct model: writes are independent and should be expressed that way.

**Why not a single transaction?**

A single transaction over all posts would be slightly more efficient (one transaction boundary instead of N) but would require building the batch manually against the raw `IDBPDatabase` handle rather than calling the exported `addPost` helper. Reusing `addPost` keeps the write path consistent with how the rest of the system writes posts (e.g. future replay or import flows). The per-call overhead of IDB `put` is negligible at these batch sizes.

**Ordering guarantee:**

`await Promise.all(writes)` suspends the async function until every write promise settles. The `self.postMessage` call that follows is only reached after `Promise.all` fulfills. This is a language-level guarantee — no custom synchronisation is needed.

## postsReady Message Shape

The outbound message from the Feed Worker to the UI main thread:

```typescript
type PostsReadyMessage = {
	type: "postsReady";
	count: number;
};

self.postMessage({ type: "postsReady", count: posts.length });
```

**Design rationale:**

- **Posts are not included in the message.** The UI re-reads from `socialFeedDb` (via `getPosts()`) rather than receiving the posts payload directly. This keeps the message small regardless of how many posts or how large their `body` fields are. It also keeps `socialFeedDb` as the single source of truth — the panel always renders what is actually stored, not a potentially stale snapshot from an in-flight message.
- **`count` is informational.** The count lets the UI log or display a badge ("3 new posts") without performing a full `getPosts` call just to determine whether anything arrived. It is not authoritative — if the UI needs the actual posts it reads from IDB.
- **`type: "postsReady"` is the discriminant.** The Feed Worker may later send other message types (e.g. `"error"`, `"status"`). The `type` field makes it trivial to dispatch on message type in the UI listener without inspecting any other field.
- **On error, count is 0.** If IDB writes fail, the message is still sent with `count: 0`. This prevents the UI from waiting indefinitely for a notification that will never arrive. The panel renders nothing new (no posts were written), which is the correct behaviour after a failed write.

## Updated feedWorker.ts

The following block replaces the Phase 15 placeholder comment (`// TODO Phase 16: write to IDB and notify`):

```typescript
// Phase 16: write posts to socialFeedDb, then notify UI
try {
	await Promise.all(posts.map((post) => addPost(post)));
	self.postMessage({ type: "postsReady", count: posts.length });
} catch (err) {
	console.error("[feedWorker] IDB write failed:", err);
	self.postMessage({ type: "postsReady", count: 0 });
}
```

**Import to add at the top of feedWorker.ts:**

```typescript
import { addPost } from "../db/socialFeedDb.ts";
```

This is an additive import — no existing imports are modified. `socialFeedDb.ts` lives at `src/ui/db/socialFeedDb.ts`; the relative path from `src/ui/workers/feedWorker.ts` is `../db/socialFeedDb.ts`.

**IDB access from the Worker context:**

Web Workers can open IndexedDB databases. `socialFeedDb` is opened by name (`"socialFeedDb"`) with no dependency on game state or league ID. Calling `addPost` from the Feed Worker is valid: `getSocialFeedDb()` resolves to the same physical database that the UI main thread would open under the same name. Because IDB is process-scoped (shared across all contexts in the same origin), the worker and the main thread both see the same data — the worker writes, the main thread reads.

This is explicitly distinct from the game Worker's IDB (`idb.league`). The Feed Worker imports from `src/ui/db/socialFeedDb.ts`, not from `src/worker/db/`. The league IDB is never touched.

## Complete feedWorker.ts

The full combined implementation, incorporating Phases 14, 15, and 16. This includes:

- The event queue / backpressure design from Phase 14 (serial processing, FIFO drain loop).
- Player/org context expansion from Phase 14 (lookup of `PlayerSummary` by `account.pid` and `TeamSummary` by `account.tid`).
- `process.env.FEED_API_URL` from Phase 15 (Rolldown env var, no `import.meta.env`).
- IDB write + `postsReady` notification from Phase 16.

```typescript
// src/ui/workers/feedWorker.ts
// Feed Worker — handles FeedEvent messages, selects agents, fetches posts from
// Vercel, writes them to socialFeedDb, and notifies the UI via postsReady.
//
// Phase 14: message handling + agent selection + event queue
// Phase 15: Vercel fetch (process.env.FEED_API_URL, postId determinism)
// Phase 16: IDB write + UI notify

import type {
	FeedEvent,
	AgentConfig,
	Account,
	ResolvedAgent,
	GeneratedPost,
} from "../../common/types.feedEvent.ts";
import { getAllAccounts, addPost } from "../db/socialFeedDb.ts";

// ─── Env config (Phase 15 — Rolldown, NOT import.meta.env) ───────────────────

const API_URL: string =
	(process.env.FEED_API_URL as string | undefined) ?? "/api/feed";

// ─── Agent roster ─────────────────────────────────────────────────────────────

import shamCharania from "../../data/socialAgents/journalists/sham_charania.json";
import homer from "../../data/socialAgents/fans/homer.json";
import statNerd from "../../data/socialAgents/fans/stat_nerd.json";
import bandwagon from "../../data/socialAgents/fans/bandwagon.json";
import hater from "../../data/socialAgents/fans/hater.json";
import playerTemplate from "../../data/socialAgents/players/template.json";
import orgTemplate from "../../data/socialAgents/orgs/template.json";

const ALL_CONFIGS: AgentConfig[] = [
	shamCharania as AgentConfig,
	homer as AgentConfig,
	statNerd as AgentConfig,
	bandwagon as AgentConfig,
	hater as AgentConfig,
	playerTemplate as AgentConfig,
	orgTemplate as AgentConfig,
];

// ─── Agent selection with player/org expansion (Phase 14) ────────────────────

async function selectAgents(event: FeedEvent): Promise<ResolvedAgent[]> {
	const accounts = await getAllAccounts();

	// Build a map from templateId → active accounts
	const activeByTemplateId = new Map<string, Account[]>();
	for (const account of accounts) {
		if (account.status !== "active") continue;
		const existing = activeByTemplateId.get(account.templateId) ?? [];
		existing.push(account);
		activeByTemplateId.set(account.templateId, existing);
	}

	const result: ResolvedAgent[] = [];

	for (const config of ALL_CONFIGS) {
		// Filter 1: agent must be triggered by this event type
		if (!config.triggers.includes(event.type)) continue;

		// Filter 2: probability roll
		if (Math.random() > config.postProbability) continue;

		// Filter 3: expand to live accounts
		if (config.type === "journalist" || config.type === "fan") {
			const account = activeByTemplateId.get(config.id)?.[0];
			if (account === undefined) continue;
			result.push({
				...config,
				agentId: account.agentId,
				displayName: account.displayName,
			});
		} else if (config.type === "player") {
			// One-to-many: each active player account that has a matching PlayerSummary
			const matchingAccounts = activeByTemplateId.get(config.id) ?? [];
			for (const account of matchingAccounts) {
				// Attach PlayerSummary from event context — skip if not present
				const playerSummary = event.context.players.find(
					(p) => p.pid === account.pid,
				);
				if (!playerSummary) continue;
				result.push({
					...config,
					agentId: account.agentId,
					displayName: account.displayName,
					// playerSummary is carried alongside the resolved agent for resolveAgentPrompt
					playerSummary,
				});
			}
		} else if (config.type === "org") {
			// One-to-many: each active org account that has a matching TeamSummary
			const matchingAccounts = activeByTemplateId.get(config.id) ?? [];
			for (const account of matchingAccounts) {
				const teamSummary = event.context.teams.find(
					(t) => t.tid === account.tid,
				);
				if (!teamSummary) continue;
				result.push({
					...config,
					agentId: account.agentId,
					displayName: account.displayName,
					// teamSummary is carried alongside the resolved agent for resolveAgentPrompt
					teamSummary,
				});
			}
		}
	}

	return result;
}

// ─── Vercel fetch (Phase 15) ──────────────────────────────────────────────────

async function fetchPosts(
	event: FeedEvent,
	agents: ResolvedAgent[],
): Promise<GeneratedPost[]> {
	if (agents.length === 0) return [];

	const body = {
		event: { type: event.type, timestamp: event.timestamp },
		context: event.context,
		agents,
	};

	const response = await fetch(API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!response.ok) {
		throw new Error(
			`[feedWorker] /api/feed responded ${response.status} ${response.statusText}`,
		);
	}

	const data = await response.json();
	return data.posts as GeneratedPost[];
}

// ─── IDB write + UI notify (Phase 16) ────────────────────────────────────────

async function writePosts(posts: GeneratedPost[]): Promise<void> {
	// Parallel writes — each addPost call is independent.
	await Promise.all(posts.map((post) => addPost(post)));
}

// ─── Core event handler ───────────────────────────────────────────────────────

async function handleFeedEvent(feedEvent: FeedEvent): Promise<void> {
	try {
		// Phase 14: select agents (with player/org expansion)
		const agents = await selectAgents(feedEvent);

		if (agents.length === 0) {
			return; // Nothing to post
		}

		// Phase 15: fetch generated posts from Vercel
		const posts = await fetchPosts(feedEvent, agents);

		// Phase 16: write all posts to socialFeedDb, then notify UI
		try {
			await writePosts(posts);
			self.postMessage({ type: "postsReady", count: posts.length });
		} catch (writeErr) {
			console.error("[feedWorker] IDB write failed:", writeErr);
			// Liveness guarantee: always notify so the UI does not wait indefinitely
			self.postMessage({ type: "postsReady", count: 0 });
		}
	} catch (err) {
		// Fetch or agent selection failure — log and exit cleanly.
		// The queue continues draining; the worker remains alive.
		console.error("[feedWorker] event processing failed:", err);
	}
}

// ─── Event queue / backpressure (Phase 14) ───────────────────────────────────
// Events are processed serially — one fetch in flight at a time.
// Incoming messages are buffered in the queue and drained in FIFO order.

const queue: FeedEvent[] = [];
let processing = false;

function enqueue(event: FeedEvent): void {
	queue.push(event);
	if (!processing) {
		void processNext();
	}
}

async function processNext(): Promise<void> {
	if (queue.length === 0) {
		processing = false;
		return;
	}
	processing = true;
	const event = queue.shift()!;
	await handleFeedEvent(event);
	void processNext();
}

// ─── Message handler ──────────────────────────────────────────────────────────

type FeedWorkerInboundMessage = {
	type: "feedEvent";
	payload: FeedEvent;
};

self.onmessage = (event: MessageEvent<FeedWorkerInboundMessage>) => {
	const msg = event.data;
	if (msg.type === "feedEvent") {
		enqueue(msg.payload);
	}
};
```

**Structural notes on the complete file:**

- The outer `try/catch` (around `selectAgents` + `fetchPosts`) catches fetch-layer failures. The inner `try/catch` (around `writePosts` + `postMessage`) catches IDB-layer failures. The two error domains are separate so a fetch failure does not suppress the IDB path and vice versa.
- The inner catch always sends `postsReady` — this is a liveness guarantee. The UI must never wait indefinitely for a message that will never arrive.
- If `agents.length === 0`, the function returns early and sends no `postsReady` message at all. This is correct: the UI has no pending expectation when no agents were triggered.
- `writePosts` is extracted into its own function for testability. The `Promise.all` logic can be unit-tested by mocking `addPost`.
- The queue ensures serial processing: only one `handleFeedEvent` call (and therefore one Vercel fetch) is in flight at a time. Events arriving during a slow fetch are buffered and processed in order.
- Player and org accounts are expanded using `PlayerSummary` (matched by `account.pid`) and `TeamSummary` (matched by `account.tid`) from `event.context`. An account without a matching summary in the event context is skipped — there is no useful personalisation data to include.

## Implementation Notes

### Why the Feed Worker writes to IDB directly

The IDB write happens entirely in the Feed Worker, not in the UI main thread. This is the correct design for two reasons:

1. **The main thread is not in the data path.** Between receiving the `postsReady` message and re-reading from IDB, the main thread does no work on the posts themselves. All transformation, validation, and storage happens in the worker. The main thread is free to remain responsive to user input during the entire operation.

2. **socialFeedDb is not the league IDB.** The Feed Worker cannot safely access the league IDB (`idb.league`), which is owned by the game Worker. But `socialFeedDb` is a separate IndexedDB database with no dependency on the game Worker. The Feed Worker opens it by name — this is exactly the same mechanism the UI main thread would use. Both can open it simultaneously; IDB handles concurrent access correctly.

### Error handling philosophy

IDB write failures are caught at the inner boundary and reported via `count: 0` on `postsReady`. The rationale:

- A failed write could be caused by storage quota exhaustion, a browser-level IDB error, or a schema mismatch from a partially upgraded database. These are transient or environmental conditions — they do not indicate a logic bug.
- Crashing the worker (by letting the error propagate to `self.onmessage` uncaught) would leave the Feed Worker dead for the remainder of the page session. All subsequent `FeedEvent` messages would be silently dropped.
- Sending `postsReady` with `count: 0` keeps the worker alive and the UI unblocked. The UI panel renders nothing new, which is the honest outcome when nothing was successfully written.
- The error is logged to the console so developers can diagnose storage issues without needing to instrument the worker further.

### Notification ordering guarantee

The sequence is:

```
await Promise.all(posts.map(post => addPost(post)));
//    ↑ suspends here until all IDB puts resolve
self.postMessage({ type: "postsReady", count: posts.length });
//    ↑ only reached after all writes are complete
```

JavaScript's async/await semantics guarantee that the line after `await` is never executed until the awaited promise settles. There is no race condition. The `postsReady` message physically cannot be dispatched to the main thread before all `addPost` promises have resolved.

### `addPost` idempotency

`addPost` uses `db.put("posts", post)` internally (see Phase 3). IDB `put` is an upsert — if a record with the same `postId` already exists, it is overwritten rather than producing an error. This means replaying the same `GeneratedPost[]` twice (e.g. due to a retry) is safe. The second write wins, but since the content is identical the outcome is the same.

### Worker lifetime

The Feed Worker is a long-lived worker instantiated once when the feed system initialises (Phase 17). It is not terminated after each event — it sits idle between events and processes each `FeedEvent` message in order. The `try/catch` structure inside `self.onmessage` ensures that a failure during one event does not prevent the worker from handling subsequent events.

### TypeScript

`self.postMessage` in a `DedicatedWorkerGlobalScope` accepts `any` as its first argument. To get type safety on the outbound message shape, declare the narrowed type locally:

```typescript
type WorkerOutboundMessage = { type: "postsReady"; count: number };

// Then cast at the call site:
(self as unknown as Worker).postMessage({
	type: "postsReady",
	count: posts.length,
} satisfies WorkerOutboundMessage);
```

Alternatively, the project may already have a utility type for typed worker messages — follow whatever pattern is established in the codebase.

## Verified by

- After a `GAME_END` event that causes 4 agents to respond, all 4 returned posts appear in `socialFeedDb.getPosts()` — confirmed by calling `getPosts()` after `postsReady` fires and asserting `posts.length === 4`.
- The `postsReady` postMessage fires after — not before — all `addPost` calls resolve. Verified by mocking `addPost` to return a promise that resolves after 50ms, asserting that `postMessage` is not called until all mocked promises settle.
- Posts written to IDB include all fields from `GeneratedPost` — none are dropped. Confirmed by strict equality between the original `GeneratedPost` objects and the records returned by `getPosts()` after the write.
- The UI main thread is not involved in the IDB write. Confirmed by auditing the `postsReady` handler in the UI: it calls `getPosts()` to read posts, not `postMessage` to push data. The write path (feedWorker → IDB) has no `postMessage` until after `Promise.all` resolves.
- A simulated IDB write failure (mocked rejection of `addPost`) causes `postsReady` to fire with `count: 0` and does not crash the worker. A subsequent `FeedEvent` message is still processed correctly.
- `getPosts(limit)` called from the UI panel after `postsReady` returns posts ordered newest-first by `createdAt` — the index ordering in `socialFeedDb` is preserved through the write.
- TypeScript compiles with zero errors after adding the `addPost` import and the write + notify block — confirmed by `tsc --noEmit`.

## Definition of Done

Posts in IDB. `postsReady` fires after all writes complete. Main thread not involved in writes. Failed writes send `postsReady` with `count: 0` rather than crashing the worker. All `GeneratedPost` fields are preserved through the write round-trip.
