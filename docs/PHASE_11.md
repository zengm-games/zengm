# Phase 11: TRADE_ALERT Hook

## Contract

When a trade is accepted and processed, a `TRADE_ALERT` FeedEvent fires carrying both teams and all exchanged players and picks. The event fires exactly once per accepted trade, after all player moves and pick transfers are committed to IDB. No event fires when a trade is rejected.

## Depends on

- **Phase 8** — `emitFeedEvent(type, context)` exists in `src/worker/util/feedEvents.ts` and is the sole callsite for `toUI("feedEvent", ...)`
- **Phase 7** — `getSocialContext(type)` exists in `src/worker/views/socialContext.ts` and reads recent transactions from `idb.league.getAll("events")`

## Delivers

- Additive change to `src/worker/core/trade/processTrade.ts`

No new files. No new types. No changes to any other file.

## processTrade() Overview

`processTrade` is a standalone async function in `src/worker/core/trade/processTrade.ts`. It accepts three arguments:

- `tids: [number, number]` — the two team IDs involved in the trade
- `pids: [number[], number[]]` — player IDs being traded from each team
- `dpids: [number[], number[]]` — draft pick IDs being traded from each team

It performs the following steps in order:

1. Identifies the best player by `valueFuzz` and reorders `pidsEvent` so he appears first (for the news feed image).
2. Calls `logEvent({ type: "trade", ... })` to write a trade event to `idb.cache.events` and get back an `eid`.
3. For each team (indices 0 and 1), iterates over the players going to the _other_ team: updates `p.tid`, resets `p.ptModifier`, reassigns jersey numbers (during-season only), appends to `p.transactions`, and writes back via `idb.cache.players.put(p)`. Also appends to `teams[k].assets`.
4. Transfers draft picks: updates `dp.tid` and writes back via `idb.cache.draftPicks.put(dp)`. Also appends to `teams[k].assets`.
5. Calls `toUI("realtimeUpdate", [["playerMovement"]])` and `recomputeLocalUITeamOvrs()` to refresh the UI.
6. If it is currently the draft phase, calls `updatePlayMenu()`.

The function does **not** return a value — it returns `Promise<void>`. It does **not** have an acceptance guard internally; it is always called only after the decision to accept has already been made by the caller.

## Hook Placement

The hook fires at the very end of `processTrade`, after all IDB writes are complete and before the function returns.

The exact insertion point is after the final `if (g.get("phase") === PHASE.DRAFT)` block and before the implicit return:

```typescript
// If draft pick was changed...
if (g.get("phase") === PHASE.DRAFT) {
	await updatePlayMenu();
}

// ← INSERT HOOK HERE

// (implicit return — function ends)
```

At this point:

- All player `tid` values have been updated in IDB.
- All draft pick `tid` values have been updated in IDB.
- The trade event has been written to `idb.cache.events` via `logEvent`, so it will appear as a `"trade"` entry in the events cache.
- The UI has already been notified via `toUI("realtimeUpdate", ...)`.

Because `getSocialContext` reads `idb.league.getAll("events")` to build `context.transactions`, the trade event written by `logEvent` will already be persisted by the time the context is assembled.

The hook line:

```typescript
void getSocialContext("TRADE_ALERT").then((context) =>
	emitFeedEvent("TRADE_ALERT", context),
);
```

Required imports to add to `processTrade.ts`:

```typescript
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
```

## Accepted vs Rejected Trades

`processTrade` itself contains no acceptance guard. It is a pure executor — it is only ever called after the calling code has already decided the trade is accepted.

There are two callers:

**`src/worker/core/trade/propose.ts`** — handles user-proposed trades. The acceptance decision lives here:

```typescript
let outcome = "rejected"; // Default

const dv = await team.valueChange(...);

if (dv > 0 || forceTrade) {
    outcome = "accepted";
    await processTrade(tids, pids, dpids);  // ← only on accept
    ...
}
```

`processTrade` is only called inside the `if (dv > 0 || forceTrade)` branch. If the trade is rejected, execution falls through to the rejection message path and `processTrade` is never invoked.

**`src/worker/core/trade/betweenAiTeams.ts`** — handles AI-vs-AI trades. All validation (roster warnings, value balance checks) happens before `processTrade` is called:

```typescript
await processTrade(finalTids, finalPids, finalDpids);
return true;
```

Again, `processTrade` is only reached when the trade has been approved.

The consequence is straightforward: because `processTrade` is only ever called on accepted trades, placing the hook at the end of `processTrade` guarantees it fires on accepted trades and never on rejected ones. No additional guard is needed inside `processTrade`.

## Context Assembly

`getSocialContext("TRADE_ALERT")` assembles a `SocialContext` by reading from IDB. The trade details surface through `context.transactions`.

**How the trade appears in `context.transactions`:**

Inside `processTrade`, `logEvent({ type: "trade", ... })` is called before any player moves (line 49). This writes a `"trade"` event record to `idb.cache.events`. The event includes:

- `type: "trade"`
- `tids` — both team IDs
- `pids` — all player IDs (with the best player first)
- `dpids` — all draft pick IDs
- A human-readable `text` field generated by `logEvent`

`getSocialContext` reads `idb.league.getAll("events")` and filters to events where `ev.type` is in the set `{"trade", "freeAgent", "release", "injured"}`. The trade event written by `logEvent` has `type: "trade"`, so it passes the filter. It is then mapped to a `TransactionSummary`:

```typescript
{
    type: "trade",
    description: ev.text ?? "",   // human-readable trade description
    timestamp: ev.eid ?? 0,
}
```

**Why this is sufficient:**

The `context.transactions` array fed into the agent prompt will contain the trade description as a natural-language string. The agent uses this to compose the tweet. The description produced by `logEvent({ type: "trade" })` already names the teams and the players involved, making it suitable for the agent prompt without any additional field assembly.

**Team names in context:**

`context.teams` is populated from `idb.cache.teamSeasons` for the current season — it contains name, abbreviation, wins, and losses for every active team. The agent can look up both trade partners by `tid` from this array.

**No extra IDB read needed:**

The trade event, team records, and player summaries are all already assembled by `getSocialContext` through its standard reads. Phase 11 does not require any new query or field.

## Implementation Notes

**Fire-and-forget pattern.** The hook is non-blocking:

```typescript
void getSocialContext("TRADE_ALERT").then((context) =>
	emitFeedEvent("TRADE_ALERT", context),
);
```

`void` discards the promise, so `processTrade` returns immediately without waiting for context assembly or `emitFeedEvent` to complete. This preserves the performance characteristics of trade processing — the feed event is best-effort and must not delay the game loop.

The pattern is consistent with how Phase 9 (HALFTIME) and Phase 10 (GAME_END, INJURY) hooks are structured in those phases.

**No error propagation.** If `getSocialContext` throws (e.g. an IDB read error), the error is silently swallowed because the promise is detached via `void`. This is intentional — a feed event failure must never crash trade processing.

**Live-game guard for halftime-style events.** Any hook that is intended to fire only during an interactive (live, play-by-play) game session — such as HALFTIME — must check `local.get("liveGameInProgress")` before emitting. The TRADE_ALERT hook itself is not subject to this restriction (trades are processed outside of live sim), but the pattern applies broadly: if a feed event is only meaningful in a live context, add `if (!local.get("liveGameInProgress")) return;` (or equivalent) before the emit to avoid flooding the feed during a full-season batch simulation.

**Additive only.** The only change to `processTrade.ts` is the two import lines and the single hook line at the end of the function body. No existing logic is modified, moved, or removed. The function signature is unchanged. All return values and side effects of the original function remain identical.

**AI-vs-AI trades.** `betweenAiTeams.ts` also calls `processTrade`. The hook will fire for AI-vs-AI trades as well as user-proposed trades. This is correct — AI trades are real game events and should appear in the feed.

**Trade deadline guard.** `propose.ts` already returns early with `[false, ...]` if `g.get("phase") >= PHASE.AFTER_TRADE_DEADLINE`. This guard prevents `processTrade` from being called after the deadline. The hook inherits this behavior automatically — no additional phase check is needed inside `processTrade`.

**One event per trade.** `processTrade` is called once per trade, and the hook is at the end of the function, so exactly one `TRADE_ALERT` event fires per accepted trade.

**`logEvent` writes before the hook reads.** The `logEvent` call at the top of `processTrade` (line 49 in the current file) writes the trade event to IDB. By the time the hook fires at the bottom of the function, that event is persisted. `getSocialContext` reads `idb.league.getAll("events")`, so the new trade event is guaranteed to appear in `context.transactions`.

## Verified by

- Accepting a trade results in exactly one `TRADE_ALERT` event emitted — confirmed by asserting `emitFeedEvent` is called once with `type === "TRADE_ALERT"`
- The event context includes the names of all players exchanged and both team names — confirmed by inspecting `context.transactions[0].description` and `context.teams`
- A rejected trade (where `dv <= 0` and `forceTrade` is false in `propose.ts`) produces no `TRADE_ALERT` event — confirmed by asserting `emitFeedEvent` is never called when the rejection branch executes
- An AI-vs-AI trade via `betweenAiTeams.ts` also produces exactly one `TRADE_ALERT` event
- Pre-existing trade tests pass unchanged — the hook is fire-and-forget and has no effect on return values or observable side effects of `processTrade`
- The two added import lines compile with zero TypeScript errors under `tsc --noEmit`

## Definition of Done

Event fires on accepted trades only. Context contains trade details via `context.transactions`. Hook is fire-and-forget (`void`). Change is purely additive — no existing logic altered. Pre-existing tests pass. Compiles clean.
