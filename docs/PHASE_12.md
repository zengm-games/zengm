# Phase 12: DRAFT_PICK Hook

## Contract

When a draft pick is made, exactly one `DRAFT_PICK` FeedEvent fires. The event carries context that includes the drafted player's name, overall rating, position, and pick number — assembled from IDB immediately after the player has been written to the cache. Each call to `selectPlayer` emits exactly one event; in a multi-pick draft session, one event fires per pick.

## Depends on

- **Phase 8** — `emitFeedEvent` exists in `src/worker/util/feedEvents.ts` and is exported from `src/worker/util/index.ts`
- **Phase 7** — `getSocialContext` exists in `src/worker/views/socialContext.ts` and can be called from Worker core code

## Delivers

- Additive change to `src/worker/core/draft/selectPlayer.ts`

No new files. No new types. No changes to `selectPlayer`'s return value or its existing behavior.

## selectPlayer() Overview

`selectPlayer(dp, pid)` is the authoritative function that executes a single draft pick. Given a `DraftPick` object (`dp`) and a player ID (`pid`), it:

1. Fetches the player from `idb.cache.players`
2. Assigns the player to the drafting team (`p.tid = dp.tid`)
3. Sets the player's `draft` metadata (round, pick, team, year, ratings snapshot)
4. Assigns a rookie contract (unless fantasy/expansion draft settings override)
5. Appends a `"draft"` entry to `p.transactions` with `pickNum`
6. Writes the updated player back to cache via `idb.cache.players.put(p)`
7. Deletes the consumed draft pick from `idb.cache.draftPicks`
8. Fires an in-game `logEvent` describing the pick in the event log
9. Optionally triggers roster auto-sort for the user's team

The function is `async`, returns `void`, and is called once per pick — either by user interaction or by the automated draft runner (`untilUserOrEnd`).

## Hook Placement

The emit should be placed **after step 7** — after `idb.cache.players.put(p)` and `idb.cache.draftPicks.delete(dp.dpid)` have both been called, and before the expansion-draft `setGameAttributes` block and the `logEvent` call.

This placement guarantees:

- The player's `p.tid` reflects the drafting team at the moment `getSocialContext` reads IDB
- The player's `p.transactions` array includes the newly appended `"draft"` entry
- `getSocialContext("DRAFT_PICK")` can find the player in the active-roster index (`playersByTid`) because `p.tid >= 0` is now set

```typescript
// After idb.cache.players.put(p) and idb.cache.draftPicks.delete(dp.dpid):
void getSocialContext("DRAFT_PICK").then((context) =>
	emitFeedEvent("DRAFT_PICK", context),
);
```

The fire-and-forget pattern (`void ... .then(...)`) ensures `selectPlayer` does not block on context assembly or event dispatch. The existing return value and timing of `selectPlayer` are unchanged.

## Context Assembly

### How the pick appears in context.transactions

`getSocialContext("DRAFT_PICK")` reads `idb.league.getAll("events")` to populate `context.transactions`. The `logEvent` call inside `selectPlayer` (which fires after the emit, or can be left in its current position — see Implementation Notes) writes an event of type `"draft"` to the event log. However, the Phase 7 `getSocialContext` implementation filters transactions to the set `{ "trade", "freeAgent", "release", "injured" }`, which does not include `"draft"`.

This means the drafted player will **not** appear in `context.transactions` via the events store. The agent downstream receives the pick context through `context.players` instead (see below). This is acceptable: the tweet content for a draft pick is primarily about the player picked, not about a transaction log entry.

If a future iteration wants draft picks in `context.transactions`, the `eventTypes` set in `getSocialContext` would need to be extended to include `"draft"`, and a `TransactionSummary` type mapping would need to be added. That is out of scope for Phase 12.

### How the player appears in context.players

After `idb.cache.players.put(p)` completes, the player is in cache with `p.tid = dp.tid` (a valid team ID ≥ 0). `getSocialContext` queries `idb.cache.players.indexGetAll("playersByTid", [0, Infinity])`, which returns all players with a non-negative `tid`. The newly drafted player is included in this result set.

`getSocialContext` then sorts by OVR descending and slices to the top 20. Whether the drafted player appears in `context.players` depends on their OVR relative to other rostered players. High-OVR prospects (top draft picks) will typically appear; late-round picks with low OVR may not. This is the intended behavior — the display threshold is organic, not a hard cutoff specific to draft events.

The `PlayerSummary` fields available for tweet generation:

| Field      | Source                             |
| ---------- | ---------------------------------- |
| `name`     | `${p.firstName} ${p.lastName}`     |
| `position` | `p.ratings.at(-1)?.pos`            |
| `ovr`      | `p.ratings.at(-1)?.ovr`            |
| `tid`      | `p.tid` (the drafting team)        |
| `teamName` | Resolved from `currentTeamSeasons` |

The pick number (`pickNum`) is not directly in `PlayerSummary`. It is available in `p.transactions.at(-1).pickNum` for the player record at the time of the call. The agent assembling the tweet can reference the pick number from the transaction log on `p` if needed, but `context.players` as returned by `getSocialContext` does not surface it as a top-level field.

### What the agent receives

The `DRAFT_PICK` event's `context` object has the same shape as any other `SocialContext`:

- `context.players` — top rostered players by OVR; may include the drafted player if their OVR is high enough
- `context.teams` — all current team summaries including the drafting team's record
- `context.standings` — full standings, allowing the agent to note whether the drafting team is a contender or rebuilding
- `context.recentGames` — last 5 completed games
- `context.transactions` — recent trade/signing/release/injury events (not draft picks in v1)
- `context.liveGame` — absent (no `liveStats` arg is passed)

## Implementation Notes

### Exact diff

The change is a single fire-and-forget call added after line 147 (after `idb.cache.draftPicks.delete(dp.dpid)`):

```typescript
// src/worker/core/draft/selectPlayer.ts
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";

// ... inside selectPlayer, after idb.cache.draftPicks.delete(dp.dpid):

try {
	await emitFeedEvent("DRAFT_PICK", await getSocialContext("DRAFT_PICK"));
} catch (err) {
	console.error("[feedHook] failed to emit DRAFT_PICK", err);
}
```

Because `selectPlayer` is already `async`, a `try/catch` with `await` is the preferred pattern here over a detached `void` chain — it keeps error handling explicit without blocking the caller any more than the existing `await idb.cache.players.put(p)` calls do. If strict fire-and-forget is required (e.g. inside `untilUserOrEnd`'s tight loop), use the `.catch` form instead:

```typescript
void getSocialContext("DRAFT_PICK")
	.then((context) => emitFeedEvent("DRAFT_PICK", context))
	.catch((err) => console.error("[feedHook] failed to emit DRAFT_PICK", err));
```

Two imports are added at the top of the file. Everything else in the file is unchanged.

### Import paths

`selectPlayer.ts` lives at `src/worker/core/draft/selectPlayer.ts`. The relative paths from that location are:

- `getSocialContext` → `"../../views/socialContext.ts"`
- `emitFeedEvent` → `"../../util/feedEvents.ts"`

Alternatively, if both utilities are exported from their respective `index.ts` barrel files, the imports can use the barrel:

- `getSocialContext` → `"../../views/index.ts"` (exported as `socialContext` — Phase 7 registers it there)
- `emitFeedEvent` → `"../../util/index.ts"` (exported from Phase 8)

Use whichever form is consistent with the style of existing imports at the top of `selectPlayer.ts`. The existing imports use named barrel imports from `"../index.ts"` for `player`, `league`, and `team`, and direct relative imports for utilities. Match that convention.

### Why fire-and-forget

`selectPlayer` is called in a tight loop by `untilUserOrEnd` — the automated draft runner that advances through all remaining picks. Each call must resolve promptly. `getSocialContext` performs several IDB reads (`teamSeasons`, `players`, `games`, `events`), which are async but non-blocking. Using `void ... .then(...)` means `selectPlayer` schedules the context read and returns immediately, without waiting for the reads to complete or the event to dispatch. The draft loop continues to the next pick without delay.

This is safe because:

- `getSocialContext` is read-only — it cannot corrupt state if it runs concurrently with the next pick
- `emitFeedEvent` is fire-and-forget on the UI side as well — `toUI` does not block the Worker
- Events for successive picks may arrive at the UI slightly out of order if IDB reads resolve at different times, but this is acceptable for a social feed

### One event per pick, always

Every execution path through `selectPlayer` reaches the emit site:

- Normal draft: `dp.pick > 0`, player found, player written to cache → emit fires
- Fantasy draft: same code path for `p.tid` assignment, `p.transactions.push`, and `idb.cache.players.put(p)` — emit fires
- Expansion draft: same — emit fires

The only exit paths that skip the emit are the two early throws at the top of the function (invalid pick number or invalid pid). These are error conditions and do not represent a completed pick, so skipping the emit is correct.

### No change to return value

`selectPlayer` returns `Promise<void>`. This is unchanged. The added `void ... .then(...)` expression does not affect the return value because it is a statement, not an expression that feeds into the return.

### Existing draft tests

The existing test suite for `selectPlayer` tests the function's observable behavior: player assignment, contract setting, transactions, `logEvent` output, and `idb` writes. The added emit is fire-and-forget and does not affect any of these observable outcomes. Tests that mock `idb` and `g` will continue to pass because `getSocialContext` reads from those same mocks and `emitFeedEvent` calls `toUI`, which short-circuits to `Promise.resolve()` in the test environment (as documented in Phase 8).

If a test explicitly asserts that no extra calls are made (e.g., by verifying mock call counts on `toUI`), it may need to be updated to allow one additional `toUI("feedEvent", ...)` call per pick. This is a test hygiene update, not a behavioral regression.

## Verified by

- Selecting a draft pick (calling `selectPlayer(dp, pid)`) results in exactly one `DRAFT_PICK` event reaching the UI via `toUI("feedEvent", ...)`
- The event's `context.players` array contains the drafted player if their OVR places them in the top 20 rostered players
- The drafted player in `context.players` has the correct `name`, `position`, `ovr`, and `tid` (the drafting team)
- Simulating a 30-pick draft round produces exactly 30 `DRAFT_PICK` events — one per pick, none skipped, none duplicated
- Pre-existing draft tests (`selectPlayer` unit tests and any integration tests for the draft flow) pass without modification to their assertions
- `tsc --noEmit` on `selectPlayer.ts` passes with zero errors after the imports and emit are added
- The `selectPlayer` function's return value remains `Promise<void>` — no callers require changes

## Definition of Done

Event fires per pick. Context contains pick details. Return value and existing behavior of `selectPlayer` unchanged. No new files. Pre-existing draft tests pass.
