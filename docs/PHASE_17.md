# Phase 17: UI Relay — `feedEventHandler.ts`

## Architecture Note — Where the Feed Worker Lives

**The Feed Worker (`feedWorker.ts`) is instantiated ONCE inside the game worker (`src/worker/index.ts`), NOT in the UI thread.** The UI thread does not create or hold a reference to the Feed Worker. It does not `postMessage` to the Feed Worker directly.

The UI receives `FeedEvent` payloads via `toUI("feedEvent")` messages sent from the game worker. The game worker is also responsible for forwarding those events to the Feed Worker. Phase 17's responsibility in the UI is limited to: (a) registering the `feedEvent` handler in `src/ui/api/index.ts` so the channel type-checks, and (b) implementing that handler to update UI state or trigger an IDB read. The UI reads posts from `socialFeedDb` using its own IDB connection — it does not query the Feed Worker.

## Contract

When `toUI("feedEvent")` fires in the UI, the handler updates the component's loading state and triggers a fresh IDB read from `socialFeedDb`. The handler contains no business logic beyond that — it does not relay the event to any Worker. The UI thread is a consumer of events, not a relay.

## Depends on

- **Phase 8** — `toUI("feedEvent", event)` is emitted by `emitFeedEvent` in the game worker, and `feedEvent` is registered as a valid key in `src/ui/api/index.ts` (currently a no-op stub that Phase 17 replaces with real dispatch)
- **Phase 16** — The Feed Worker is instantiated inside the game worker and is running; the game worker forwards `FeedEvent` values to it and also calls `toUI("feedEvent", event)` so the UI can react
- **Phase 3** — `socialFeedDb` exposes `getPosts()` / `getPostsByAgent()` readable from the UI thread via its own IDB connection

## Delivers

- `src/ui/util/feedEventHandler.ts` — The UI-side `feedEvent` handler: updates panel state and triggers an IDB read
- `src/ui/api/index.ts` — Updated: the `feedEvent` stub is replaced with a call to `feedEventHandler`

## UI Panel Loading States

The feed panel must handle three distinct states. These must be represented explicitly in component state — an empty `posts` array alone is ambiguous.

```typescript
type FeedStatus = "loading" | "empty" | "ready";
```

| State       | Meaning                                     | UI                          |
| ----------- | ------------------------------------------- | --------------------------- |
| `'loading'` | Game worker initializing / IDB not yet read | Spinner or "Loading…" text  |
| `'empty'`   | IDB read completed, no posts exist yet      | "No posts yet." message     |
| `'ready'`   | Posts exist in IDB and have been read       | List of `<Post>` components |

The component starts in `'loading'` on mount. After the first IDB read completes:

- If the result is an empty array → transition to `'empty'`
- If the result has posts → transition to `'ready'`

On every subsequent `feedEvent` (via `toUI`), re-read IDB and update both `posts` and `status` accordingly.

```typescript
const [status, setStatus] = useState<FeedStatus>("loading");
const [posts, setPosts] = useState<GeneratedPost[]>([]);

const loadPosts = useCallback(async () => {
	const fetched = await getPosts();
	setPosts(fetched);
	setStatus(fetched.length > 0 ? "ready" : "empty");
}, []);
```

Render logic:

```typescript
if (status === 'loading') return <p className="text-body-secondary">Loading…</p>;
if (status === 'empty')   return <p className="text-body-secondary">No posts yet.</p>;
// status === 'ready': render posts
```

## `feedEventHandler.ts` Implementation

The handler is called when `toUI("feedEvent")` fires in the UI. Its role is to signal the UI panel that new data may be available — the panel then re-reads IDB. The handler does not relay anything to any Worker.

```typescript
// src/ui/util/feedEventHandler.ts
import type { FeedEvent } from "../../common/types.feedEvent.ts";

// Registered listeners from UI components (e.g. SocialFeedPanel)
const listeners = new Set<(event: FeedEvent) => void>();

export function feedEventHandler(event: FeedEvent): void {
	listeners.forEach((fn) => fn(event));
}

export function addFeedEventListener(
	fn: (event: FeedEvent) => void,
): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
```

The UI panel subscribes via `addFeedEventListener` in a `useEffect`, and on each notification re-reads `socialFeedDb` for the latest posts. The handler never calls `postMessage` — the UI thread has no reference to the Feed Worker.

## Feed Worker Singleton — Location

**The Feed Worker singleton lives in the game worker (`src/worker/index.ts` or equivalent), not in the UI thread.**

The UI thread never calls `new Worker(new URL("./feedWorker.ts", ...))`. Creating the Feed Worker in `src/ui/util/feedWorker.ts` is incorrect and must not be done. See Phase 18 for the correct instantiation location and startup sequence.

The UI reacts to events via:

1. `toUI("feedEvent", event)` messages that arrive from the game worker — handled by `feedEventHandler`
2. Direct IDB reads from `socialFeedDb` using its own connection (see "IDB Reads from the UI Thread" below)

## IDB Reads from the UI Thread

The `socialFeedDb` connection used by the UI thread is a **separate connection** from the one used by the game worker. IndexedDB allows multiple connections to the same database — each execution context (UI thread, game worker, feed worker) opens its own connection independently. They share the same underlying database but do not share a connection object.

The UI opens its connection using `@dumbmatter/idb`, the same library used by the game worker:

```typescript
// src/ui/db/socialFeedDb.ts (UI-side module, separate from the worker-side one)
import { openDB } from "@dumbmatter/idb";
import type { SocialFeedDB } from "../../common/types.socialFeedDb.ts";

let dbPromise: ReturnType<typeof openDB<SocialFeedDB>> | undefined;

function getDb() {
	if (!dbPromise) {
		dbPromise = openDB<SocialFeedDB>("socialFeed", 1);
	}
	return dbPromise;
}

export async function getPosts(limit = 50): Promise<GeneratedPost[]> {
	const db = await getDb();
	// read from the "posts" object store, ordered by createdAt desc
	return db.getAllFromIndex(
		"posts",
		"createdAt",
		IDBKeyRange.upperBound(Date.now()),
		limit,
	);
}
```

This follows the same pattern used by `src/ui/util/makeExportStream.ts`, which opens a separate `openDB(...)` connection to the league database from the UI thread without going through the game worker.

The `socialFeedDb` connection in the game worker and the one in the UI thread are independent. Writes from the game worker (or Feed Worker) are visible to the UI thread's reads once the IDB transaction commits — this is the normal IDB multi-connection behavior.

## Registering the Handler

Phase 8 added a no-op `feedEvent` stub to `src/ui/api/index.ts` so that `toUI("feedEvent")` would type-check in the Worker. Phase 17 replaces that stub with a real call to `feedEventHandler`.

### Step 1: Import feedEventHandler

At the top of `src/ui/api/index.ts`, add:

```typescript
import { feedEventHandler } from "../util/feedEventHandler.ts";
```

### Step 2: Replace the stub

Remove the no-op stub function:

```typescript
// REMOVE this (Phase 8 stub):
const feedEvent = (event: FeedEvent): void => {
	// Phase 17 replaces this stub with real dispatch logic.
};
```

Replace it with a direct reference to the imported handler:

```typescript
// ADD this:
const feedEvent = feedEventHandler;
```

Or inline it without an intermediate binding — either form is acceptable:

```typescript
export default {
	analyticsEvent,
	autoPlayDialog,
	confirm,
	confirmDeleteAllLeagues,
	crossTabEmit,
	deleteGames,
	feedEvent: feedEventHandler, // <-- Phase 17: replace no-op stub
	initAds,
	initGold,
	mergeGames,
	newLid,
	realtimeUpdate: realtimeUpdate2,
	requestPersistentStorage,
	resetLeague,
	setGameAttributes,
	showEvent: showEvent2,
	showModal,
	updateLocal,
	updateTeamOvrs,
};
```

The `FeedEvent` type import that Phase 8 added to `src/ui/api/index.ts` (for the stub's parameter annotation) can be removed if it is no longer referenced directly in that file after the stub is deleted. `feedEventHandler.ts` carries its own type import.

### Why not register in src/ui/util/index.ts

`src/ui/util/index.ts` is the barrel file for UI utilities. It re-exports modules for use throughout the UI codebase. It is not where `toUI` channels are registered — that registration happens in `src/ui/api/index.ts` through the exported object that the Worker's `toUI` function is typed against.

The `feedEventHandler` function is exported from `src/ui/util/feedEventHandler.ts` and can be added to `src/ui/util/index.ts` as a barrel re-export if other UI code needs to import it directly:

```typescript
// src/ui/util/index.ts — optional addition:
export { feedEventHandler } from "./feedEventHandler.ts";
```

This is optional for Phase 17. The only consumer that must exist is `src/ui/api/index.ts`. Add the barrel export if a future phase or debugging tool needs to reference `feedEventHandler` from outside `src/ui/api/`.

## toUI Channel Registration

The `feedEvent` channel was registered as a valid `toUI` key in Phase 8 via the stub entry in `src/ui/api/index.ts`. Phase 17 does not add a new channel — it replaces the no-op body of the existing channel entry with a real implementation.

No changes are needed to `src/worker/util/toUI.ts`. The Worker-side typing is already correct: `toUI("feedEvent", event)` resolves to `api["feedEvent"]`, which is typed as `(event: FeedEvent) => void`. The `FeedEvent` parameter type is already enforced at the callsite in `src/worker/util/feedEvents.ts`.

To verify the channel was registered correctly by Phase 8:

```
grep -n "feedEvent" src/ui/api/index.ts
```

Must show the key present in the exported object. If Phase 8 was skipped or incomplete, add both the import and the key entry as described in the Phase 8 doc before proceeding.

## Implementation Notes

### The UI never holds a Feed Worker reference

The UI thread must not instantiate the Feed Worker. No `new Worker(new URL("./feedWorker.ts", ...))` call belongs in any file under `src/ui/`. The Feed Worker is a game-worker-internal concern. Any code in `src/ui/` that creates a second Feed Worker instance will be a disconnected dead instance — it will receive no `postMessage` calls and produce no posts.

If UI components need to react to feed events, they use `addFeedEventListener` from `feedEventHandler.ts`, which is notified by the `toUI("feedEvent")` channel. The UI then reads from `socialFeedDb` via its own IDB connection.

### Synchronous notification, asynchronous IDB read

The `feedEventHandler` notifies listeners synchronously (iterating the `Set`). Each listener's IDB read is async. This matches the pattern of every other `toUI` handler in `src/ui/api/index.ts` — the handler itself is `void`, not `Promise<void>`, and returns immediately.

### No null check on the listeners Set

The `listeners` Set is module-level and initialized at module evaluation time. By the time any event can arrive on the UI thread, the module has been evaluated and the Set is live. No null check or lazy initialization is needed.

### IDB connection is not shared between contexts

The game worker's `socialFeedDb` connection and the UI thread's `socialFeedDb` connection are separate `IDBDatabase` objects pointing to the same underlying database. This is standard IndexedDB multi-connection behavior. The UI must call `openDB(...)` independently — it cannot import or reuse the game worker's connection object, which lives in a different execution context entirely.

## Verified by

- Every call to `toUI("feedEvent", event)` in the game worker causes `feedEventHandler` to notify all registered listeners in the UI thread
- `grep -r "new Worker" src/ui/` returns zero results for `feedWorker` — the Feed Worker is not instantiated in the UI thread
- The panel transitions through `loading` → `empty` / `ready` correctly on first mount and on each subsequent `feedEvent`
- `tsc --noEmit` passes with zero errors on `feedEventHandler.ts` and `src/ui/api/index.ts` after all changes are applied
- Opening a league, simulating games, and triggering draft picks / trades causes the feed panel to re-read IDB and display updated posts without a page reload

## Definition of Done

`feedEvent` channel in `src/ui/api/index.ts` calls `feedEventHandler`. Panel loading states (`loading` / `empty` / `ready`) are implemented. UI reads IDB via its own `openDB` connection. No Feed Worker instantiation in any UI file. `tsc --noEmit` clean.
