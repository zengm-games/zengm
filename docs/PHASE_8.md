# Phase 8: `emitFeedEvent()` Utility

## Contract

A utility function exists in the Worker that packages a `FeedEvent` and pushes it to the UI thread via `toUI()`. It is the only place in the entire codebase that calls `toUI("feedEvent", ...)`. All hook phases (9–13) import and call `emitFeedEvent` — none call `toUI("feedEvent")` directly.

## Depends on

- Phase 7 (`getSocialContext` exists and is callable from Worker utilities) — the context payload passed to `emitFeedEvent` is produced by `getSocialContext` in each calling hook
- Phase 1 (`src/common/types.feedEvent.ts`) — the `FeedEventType`, `SocialContext`, and `FeedEvent` types

## Delivers

- `src/worker/util/feedEvents.ts`

## Implementation

The function is small by design. Its entire job is to stamp `timestamp` and call `toUI`.

```typescript
// src/worker/util/feedEvents.ts
import toUI from "./toUI.ts";
import type {
	FeedEventType,
	SocialContext,
	FeedEvent,
} from "../../common/types.feedEvent.ts";

export function emitFeedEvent(
	type: FeedEventType,
	context: SocialContext,
): void {
	const event: FeedEvent = {
		type,
		timestamp: Date.now(),
		context,
	};
	toUI("feedEvent", event);
}
```

No other logic belongs here. No context assembly, no agent selection, no network calls. One function. One callsite.

## Usage Pattern

Each hook phase (9–13) calls `getSocialContext` first, then calls `emitFeedEvent` with the result. The hook is responsible for context assembly; `emitFeedEvent` is responsible only for packaging and dispatch.

```typescript
// In a halftime hook (Phase 9 example):
import { getSocialContext } from "../util/getSocialContext.ts";
import { emitFeedEvent } from "../util/feedEvents.ts";

// ... inside the halftime handler, after game state is available:
const context = await getSocialContext("HALFTIME", liveStats);
emitFeedEvent("HALFTIME", context);
```

```typescript
// In a trade hook (Phase 11 example):
const context = await getSocialContext("TRADE_ALERT");
emitFeedEvent("TRADE_ALERT", context);
```

```typescript
// In a draft hook (Phase 12 example):
const context = await getSocialContext("DRAFT_PICK");
emitFeedEvent("DRAFT_PICK", context);
```

The pattern is identical across all hooks: `await getSocialContext(...)` then `emitFeedEvent(...)` synchronously. `emitFeedEvent` itself is never `await`ed — it is `void` and `toUI` is fire-and-forget.

## Singleton Callsite Rule

`emitFeedEvent` is the single callsite for `toUI("feedEvent", ...)` in the entire codebase. This is enforced by convention and verified by search:

```
grep -r 'toUI("feedEvent"' src/
# Must return exactly one result: src/worker/util/feedEvents.ts
```

Why this matters:

1. **Shape correctness.** The `FeedEvent` type requires `type`, `timestamp`, and `context`. If each hook assembled the payload itself, any one of them could omit a field or mistype it. Centralizing construction in `emitFeedEvent` means the shape is only correct or incorrect in one place.

2. **Single debug point.** When a `feedEvent` message arrives on the UI thread with bad data, there is exactly one place to add a `console.log` or breakpoint: `emitFeedEvent`. If the callsite were spread across five hook files, diagnosing a payload issue would require checking each one.

3. **Timestamp authority.** `Date.now()` is called once, inside `emitFeedEvent`. No hook independently stamps a timestamp. This ensures the timestamp reflects when the event was dispatched — not when the hook began running, which may be earlier if `getSocialContext` takes time.

4. **Future-proofing.** If the `FeedEvent` shape changes (e.g. a `version` field is added in a future phase), there is one file to update, not five.

Hooks that bypass `emitFeedEvent` and call `toUI("feedEvent")` directly violate this rule and will break the singleton invariant. Code review should reject any such addition.

## toUI Registration

`toUI` in this project is typed against the default export of `src/ui/api/index.ts`. The generic constraint is:

```typescript
// src/worker/util/toUI.ts
const toUI = <Name extends keyof typeof api>(
	name: Name,
	args: Parameters<(typeof api)[Name]>,
	conditions: Conditions = {},
): Promise<ReturnType<(typeof api)[Name]>> => { ... };
```

`Name` must be a key of the UI API object. To make `toUI("feedEvent", event)` type-check, a `feedEvent` handler must be added to `src/ui/api/index.ts`.

### Step 1: Add the handler function

In `src/ui/api/index.ts`, add a handler that receives the `FeedEvent` and dispatches it for further processing (Phase 17 wires this to the feed worker):

```typescript
import type { FeedEvent } from "../../common/types.feedEvent.ts";

const feedEvent = (event: FeedEvent): void => {
	// Phase 17 replaces this stub with real dispatch logic.
	// For now, the channel just needs to exist so toUI("feedEvent") type-checks.
};
```

### Step 2: Add it to the exported object

```typescript
export default {
	analyticsEvent,
	autoPlayDialog,
	confirm,
	confirmDeleteAllLeagues,
	crossTabEmit,
	deleteGames,
	feedEvent, // <-- add this
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

Once `feedEvent` is in the exported object, `toUI("feedEvent", event)` compiles without error. TypeScript infers the argument type from `Parameters<typeof api["feedEvent"]>`, which resolves to `[FeedEvent]`. Passing anything other than a `FeedEvent` is a compile-time error.

### Why the stub handler is acceptable in Phase 8

Phase 8 only needs the channel to exist so the Worker can send messages. The UI-side handler does not need to do anything useful yet — that is Phase 17's job. A no-op stub satisfies the type system and allows all hook phases (9–13) to compile and emit events even before the UI is wired to receive them.

## Implementation Notes

### Import path

`feedEvents.ts` lives in `src/worker/util/` alongside `toUI.ts`. The import uses a relative path with `.ts` extension, consistent with all other utilities in this directory:

```typescript
import toUI from "./toUI.ts";
```

Utilities that sit next to each other in `src/worker/util/` always import `toUI` this way (see `achievement.ts`, `logEvent.ts`, `lock.ts`, `updatePhase.ts`). Do not import from `"../util/index.ts"` inside a util file — that pattern is used by files outside the `util/` directory (e.g. files in `src/worker/core/` or `src/worker/api/`).

### Export style

`emitFeedEvent` is exported as a named export, not a default export. This is consistent with Phase 7's `getSocialContext` and allows hook phases to import it cleanly:

```typescript
import { emitFeedEvent } from "../util/feedEvents.ts";
```

### Synchronous by design

`emitFeedEvent` is `void`, not `Promise<void>`. `toUI` returns a `Promise` (because `promiseWorker.postMessage` is async), but `emitFeedEvent` does not `await` it and does not surface the promise to callers. This is intentional: feed events are fire-and-forget notifications. The Worker does not need to wait for the UI to acknowledge receipt before continuing game simulation. Hooks call `emitFeedEvent` and move on.

If the UI is unavailable (e.g. in a test environment), `toUI` returns `Promise.resolve()` immediately (see the `process.env.NODE_ENV === "test"` branch in `toUI.ts`). This means `emitFeedEvent` is safe to call in unit tests without any mocking.

### No getSocialContext inside emitFeedEvent

`emitFeedEvent` does not call `getSocialContext`. Separation of concerns: the hook knows what triggered the event and what live data is available at that moment. The utility knows only how to package and send. This keeps `emitFeedEvent` synchronous (no `await`), testable with a simple mock context object, and free of any dependency on game state.

### Export from index.ts

Add `emitFeedEvent` to `src/worker/util/index.ts` so hook phases can import it consistently with other Worker utilities:

```typescript
export { emitFeedEvent } from "./feedEvents.ts";
```

This is optional for Phase 8 itself but expected by hook phases 9–13, which will import from `"../../util/index.ts"` or `"../util/index.ts"` depending on their location in the directory tree.

## Verified by

- Calling `emitFeedEvent("HALFTIME", mockContext)` results in `toUI("feedEvent", ...)` being called exactly once with a payload that contains `type: "HALFTIME"`, a numeric `timestamp`, and the `mockContext` object as `context`
- The payload passed to `toUI` satisfies the `FeedEvent` type from `src/common/types.feedEvent.ts` — all three required fields (`type`, `timestamp`, `context`) are present and correctly typed
- `tsc --noEmit` on `src/worker/util/feedEvents.ts` passes with zero errors and zero `any`
- Searching the codebase for `toUI("feedEvent"` returns exactly one result: `src/worker/util/feedEvents.ts`
- In the test environment (`process.env.NODE_ENV === "test"`), `emitFeedEvent` can be called without throwing — `toUI` short-circuits to `Promise.resolve()`
- Hook phases that `import { emitFeedEvent } from "../util/feedEvents.ts"` (or from `index.ts`) compile without TypeScript errors

## Definition of Done

One function. One callsite. Payload is typed. `toUI("feedEvent"` appears in exactly one file in the codebase. `feedEvent` is registered as a valid channel in `src/ui/api/index.ts`. `tsc --noEmit` passes clean.
