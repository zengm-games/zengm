# Phase 13: SEASON_AWARD + PLAYOFF_CLINCH Hooks

## Contract

Two new feed events fire at season phase transitions:

- `SEASON_AWARD` fires once per season, immediately after `season.doAwards()` completes and award winners have been written to `idb.cache.awards`. The context contains the full `SocialContext` at the moment of award settlement, allowing downstream agents to see winner names and stat lines via `context.players` and `context.transactions`.

- `PLAYOFF_CLINCH` fires once at the end of `newPhasePlayoffs`, after `team.updateClinchedPlayoffs(true, conditions)` has finalized every team's clinch status. A single event covers all clinching teams for that season transition; the context includes the current standings so agents can see which seeds clinched.

Both events are fire-and-forget additions to existing phase functions. Neither modifies existing control flow, return values, or database writes.

## Depends on

- **Phase 8** — `emitFeedEvent` exists in `src/worker/util/feedEvents.ts` and is exported from `src/worker/util/index.ts`.
- **Phase 7** — `getSocialContext` exists in `src/worker/views/socialContext.ts` and assembles a `SocialContext` from IDB cache.

## Delivers

- Additive change to `src/worker/core/phase/newPhaseBeforeDraft.ts` — one `SEASON_AWARD` event after `season.doAwards(conditions)` resolves.
- Additive change to `src/worker/core/phase/newPhasePlayoffs.ts` — one `PLAYOFF_CLINCH` event after `team.updateClinchedPlayoffs(true, conditions)` resolves.

No new files. No new exports. No schema changes.

## SEASON_AWARD Hook

### Where awards are computed

In `newPhaseBeforeDraft.ts`, the relevant call is on line 328:

```typescript
await season.doAwards(conditions);
```

`doAwards` dispatches to a sport-specific implementation (e.g. `doAwards.basketball.ts`). By the time `doAwards` resolves, the following have all been written to cache:

- `idb.cache.awards.put(awards)` — the full awards object for the season (MVP, DPOY, ROY, SMOY, MIP, Finals MVP, All-League teams, etc.)
- `saveAwardsByPlayer(awardsByPlayer, conditions, awards.season)` — individual player award records which also fire `logEvent` entries into the IDB events store (accessible via `idb.league`)

This means that immediately after `await season.doAwards(conditions)` returns, both the awards store and the events store are fully populated with the season's award data.

### Placement

The hook fires immediately after `await season.doAwards(conditions)` and before the championship award block that follows it:

```typescript
// EXISTING:
await season.doAwards(conditions);

// ADD AFTER:
// Phase 13 — SEASON_AWARD feed event
// Awards are now in idb.cache.awards and award events are in idb.league (events store).
// getSocialContext will pick up winners via context.players (OVR-sorted active
// players include award winners) and context.transactions (award logEvents are
// in the events store). Fire-and-forget; do not await.
//
// eventMetadata carries structured award data for downstream agents:
//   { awardType: string, playerName: string, teamName: string }
// Populate it from the awards object returned/written by doAwards.
getSocialContext("SEASON_AWARD").then((context) => {
	// Example: surface the MVP award in eventMetadata
	// (replace with actual awards object reference from doAwards scope)
	const eventMetadata = {
		awardType:  "MVP",          // or iterate all awards for multiple events
		playerName: awards.mvp ? `${awards.mvp.firstName} ${awards.mvp.lastName}` : "",
		teamName:   awards.mvp?.abbrev ?? "",
	};
	emitFeedEvent("SEASON_AWARD", context, eventMetadata);
}).catch((err) => {
	console.error("[feedHook] failed to emit SEASON_AWARD", err);
});

// EXISTING (continues):
const teams = await idb.getCopies.teamsPlus(
```

### Why here, not earlier

Placing the hook before `doAwards` would mean `idb.cache.awards` has not been written yet, so `getSocialContext` could not read award winners from the events store. Placing it after the championship-award block (a few lines later) is also safe but unnecessary — the major awards (MVP, DPOY, ROY, etc.) are already in cache at this point. The championship "Won Championship" awards for individual players are a separate `addAward` loop and are not captured by the `SEASON_AWARD` event; that is intentional and acceptable.

### What getSocialContext captures

At the moment `SEASON_AWARD` fires:

- `context.players` — the top-20 players by OVR. Award winners (MVP, Finals MVP) are typically high-OVR players and will appear here with their stat lines (`pts`, `reb`, `ast`).
- `context.transactions` — filtered from `idb.league.getAll("events")` (not `idb.cache`). The `saveAwardsByPlayer` call in `doAwards.basketball.ts` calls `logEvent` for each award winner, recording entries of type `"award"`. These will appear in `context.transactions` if the `eventTypes` filter in `getSocialContext` includes `"award"`.

**Action required for `getSocialContext` (Phase 7 follow-up):** The current `eventTypes` set in `getSocialContext` is `{ "trade", "freeAgent", "release", "injured" }`. To surface award events in `context.transactions`, add `"award"` to this set and extend the `typeMap` to map `"award"` to a new or existing `TransactionSummary` type. This is a small additive change to `src/worker/views/socialContext.ts`.

If the `"award"` event type is not added, `SEASON_AWARD` still fires with a valid `SocialContext` — agents will see the current standings, top players by OVR, and recent game results. They will not see explicit award winner entries in `context.transactions`. Either behaviour is acceptable for a v1; adding `"award"` to the filter is the recommended path.

### Imports to add to newPhaseBeforeDraft.ts

```typescript
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
```

These imports are additive. No existing imports are modified.

## PLAYOFF_CLINCH Hook

### Where clinch status is finalized

In `newPhasePlayoffs.ts`, the call that locks in every team's clinch status is on line 119:

```typescript
await team.updateClinchedPlayoffs(true, conditions);
```

The `true` argument selects the `getClinchedPlayoffsFinal` path inside `updateClinchedPlayoffs.ts`, which reads the just-written `idb.cache.playoffSeries` object and derives a definitive `clinchedPlayoffs` value (`"w"`, `"x"`, `"y"`, `"z"`, or `"o"`) for every team. The `put` calls inside that function write each updated `teamSeason` back to cache, so the clinch statuses are in the cache by the time the function resolves.

### Placement

The hook fires immediately after `await team.updateClinchedPlayoffs(true, conditions)`:

```typescript
// EXISTING:
await team.updateClinchedPlayoffs(true, conditions);

// ADD AFTER:
// Phase 13 — PLAYOFF_CLINCH feed event
// All teamSeason.clinchedPlayoffs values are now finalized in cache.
// getSocialContext standings will reflect final seed assignments.
// Fire-and-forget; do not await.
//
// eventMetadata carries structured clinch data:
//   { teamName: string, conf: string }
// Use the first clinched team as the primary signal, or omit for a
// league-wide summary event (agents can derive the rest from context.standings).
getSocialContext("PLAYOFF_CLINCH").then((context) => {
	const eventMetadata = {
		teamName: "",  // optional: first clinched team name
		conf:     "",  // optional: conference name
	};
	emitFeedEvent("PLAYOFF_CLINCH", context, eventMetadata);
}).catch((err) => {
	console.error("[feedHook] failed to emit PLAYOFF_CLINCH", err);
});

// EXISTING (continues):
await realRosters.checkDisableForceHistoricalRosters(
```

### Single event versus per-team events — trade-off and recommendation

**Per-team approach:** Fire one `PLAYOFF_CLINCH` event for each team that clinched, iterating over `tidPlayoffs` (and optionally `tidPlayIn`). This gives agents a team-specific context for each event and allows one tweet per clinching team.

Drawback: If 10 teams clinch in a single phase transition (the first call to `newPhasePlayoffs`), 10 events fire simultaneously. Each spawns a `getSocialContext` call (5 IDB reads) and a `toUI` dispatch. At 30 teams this is manageable, but it creates bursty work on the Worker thread and floods the feed with simultaneous posts.

**Single-event approach (recommended):** Fire one `PLAYOFF_CLINCH` event covering all clinching teams. The `SocialContext` includes `context.standings`, which already contains every team's win/loss record and relative rank. An agent with access to standings can identify which teams clinched and write a post that covers the full picture or focuses on one notable clinch.

This approach:

- Produces at most one event per phase transition (one `getSocialContext` call, one `toUI` dispatch)
- Is simpler to implement and reason about
- Avoids message flooding on the feed
- Is consistent with how other phase hooks in this system fire once per transition

The single-event approach is the recommendation for Phase 13.

**Future consideration:** If the feed grows to support per-team personalisation (e.g. a team-affiliated agent reacting to its own team's clinch), a `PLAYOFF_CLINCH_TEAM` event type can be added later. That is a Phase 13+ concern.

### Imports to add to newPhasePlayoffs.ts

```typescript
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
```

These imports are additive. No existing imports are modified.

## Context Assembly

### How getSocialContext captures award information

`getSocialContext("SEASON_AWARD")` performs the same five reads it performs for any other event type:

1. **teamSeasons** (`idb.cache.teamSeasons.getAll()`) — produces `context.teams` and `context.standings`. At the time `SEASON_AWARD` fires, all regular-season records are final.

2. **players** (`idb.cache.players.indexGetAll("playersByTid", [0, Infinity])`) — produces `context.players`, top 20 by OVR. Award winners (MVP, DPOY, ROY) are high-OVR players and will usually appear here. Their `seasonAverages` (pts, reb, ast) give agents the stat lines needed to write award posts.

3. **recentGames** (`idb.getCopies.games({ season })`) — the last 5 completed games. Useful for colour but not the primary signal for award events.

4. **transactions** (`idb.league.getAll("events")`) — with the `"award"` type added to the `eventTypes` filter (see action item in SEASON_AWARD Hook section above), this produces a list of award-type events. Each entry carries `ev.text`, which is the human-readable award announcement string already composed by `saveAwardsByPlayer`. Example text: `"LeBron James won Most Valuable Player."` Agents can extract winner name and award type from `ev.text` directly, or use `ev.pid` / `ev.tid` if typed.

5. **liveGame** — not applicable for `SEASON_AWARD` (no `liveStats` argument); the field is absent from the context.

### How getSocialContext captures clinch information

`getSocialContext("PLAYOFF_CLINCH")` reads the same stores. The key signal is `context.standings`:

- Each `StandingEntry` includes `tid`, `name`, `abbrev`, `wins`, `losses`, `pct`, and `conf`.
- At the time `PLAYOFF_CLINCH` fires, every `teamSeason.clinchedPlayoffs` has been updated in cache (by `updateClinchedPlayoffs`). However, `clinchedPlayoffs` is not currently part of the `StandingEntry` type or the `getSocialContext` output.

**Action required for `getSocialContext` (Phase 7 follow-up):** Add `clinchedPlayoffs` to `StandingEntry` in `src/common/types.feedEvent.ts` and populate it from `ts.clinchedPlayoffs` in the standings assembly loop in `getSocialContext`. This is a small additive change to both the type file and the view.

With this addition, agents receive a standings list where each entry includes a `clinchedPlayoffs` field (`"w" | "x" | "y" | "z" | "o" | undefined`). They can filter for `"x"` (clinched playoffs) and `"z"` (clinched #1 seed) entries to identify who clinched.

If `clinchedPlayoffs` is not added to `StandingEntry`, `PLAYOFF_CLINCH` still fires with a valid `SocialContext`. Agents will see the current win/loss standings and can infer likely playoff teams from record, but they will not have an explicit clinch flag per team. The flag addition is recommended.

### No direct idb.cache.awards read in getSocialContext

`getSocialContext` does not directly read `idb.cache.awards`. The award winners are surfaced indirectly through the events store (`context.transactions`, if `"award"` is added to the filter) and through `context.players` (the top-OVR players). This is consistent with the Phase 7 design: `getSocialContext` assembles context from the standard five stores without introducing event-type-specific read branches.

## Implementation Notes

### Async fire-and-forget pattern

Both hooks use the promise-then-catch pattern. A `.catch()` handler is **required** — do not leave hook promise chains without error handling. A crash inside a hook must never propagate to the phase transition machinery.

```typescript
try {
	await emitFeedEvent(
		"SEASON_AWARD",
		await getSocialContext("SEASON_AWARD"),
		eventMetadata,
	);
} catch (err) {
	console.error("[feedHook] failed to emit SEASON_AWARD", err);
}
```

Or, when strict fire-and-forget is needed (phase transition must not be delayed at all):

```typescript
getSocialContext("SEASON_AWARD")
	.then((context) => {
		emitFeedEvent("SEASON_AWARD", context, eventMetadata);
	})
	.catch((err) => {
		console.error("[feedHook] failed to emit SEASON_AWARD", err);
	});
```

Rationale:

- The game engine must not stall waiting for feed event dispatch. Phase transitions are already computationally expensive (doAwards reads every player, generates standings, writes IDB). Adding a synchronous `await` in the fire-and-forget form would make the transition measurably slower with no benefit — `toUI("feedEvent")` is a postMessage to the UI thread and completes independently.
- `getSocialContext` reads from `idb.cache` (in-memory) for most stores, and from `idb.league` for events. These reads are fast. The async gap is negligible.
- The `.catch` handler logs errors to the console only — it does not rethrow or affect the phase transition.

### Purely additive changes

Neither hook modifies:

- The return value of `newPhaseBeforeDraft` or `newPhasePlayoffs`
- Any IDB write sequence
- Any existing `logEvent` call
- Any `updateEvents` array
- Any redirect logic

The hooks append two lines (getSocialContext + emitFeedEvent, wrapped in a promise chain) after an existing `await` call. They are invisible to the rest of the phase transition machinery.

### Test environment safety

`emitFeedEvent` calls `toUI("feedEvent", ...)`. In the test environment (`process.env.NODE_ENV === "test"`), `toUI` short-circuits to `Promise.resolve()` without postMessage. `getSocialContext` reads from `idb.cache`, which in tests is typically an in-memory stub. Both calls are safe to make in unit tests without mocking.

### Import path conventions

Both phase files (`newPhaseBeforeDraft.ts`, `newPhasePlayoffs.ts`) live in `src/worker/core/phase/`. Relative imports:

```typescript
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
```

If `emitFeedEvent` is re-exported from `src/worker/util/index.ts` (as recommended in Phase 8), the import can instead be:

```typescript
import { emitFeedEvent } from "../../util/index.ts";
```

Either form is acceptable. Use whichever is consistent with the other hook phases (9–12) already merged.

### Follow-up actions in Phase 7 files

Phase 13 identifies two additive changes needed in the Phase 7 view to make context richer. These are not blocking — both hooks fire correctly without them. They are recommended follow-ups:

| File                                | Change                                                                                     | Effect                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `src/common/types.feedEvent.ts`     | Add `clinchedPlayoffs?: "w" \| "x" \| "y" \| "z" \| "o"` to `StandingEntry`                | Agents receive explicit clinch flag per team         |
| `src/worker/views/socialContext.ts` | Populate `StandingEntry.clinchedPlayoffs` from `ts.clinchedPlayoffs` in the standings loop | Same as above                                        |
| `src/worker/views/socialContext.ts` | Add `"award"` to `eventTypes` set and `"award"` to `typeMap`                               | Award winner events appear in `context.transactions` |

These changes can be made in Phase 13 or deferred to a follow-up; they do not affect the hook firing itself.

## Verified by

- Simulating to the pre-draft phase in a test league results in at least one `SEASON_AWARD` event emitted via `toUI("feedEvent", ...)`. The event's `context.players` contains at least one player entry, and `context.standings` is non-empty.
- The `SEASON_AWARD` event fires after `doAwards` has written to `idb.cache.awards` — verifiable by checking that `idb.cache.awards.get(season)` returns the awards object before the emit and does not throw.
- Simulating to the playoffs phase results in a `PLAYOFF_CLINCH` event emitted via `toUI("feedEvent", ...)`. The event's `context.standings` is non-empty and reflects end-of-regular-season records.
- The `PLAYOFF_CLINCH` event fires after `updateClinchedPlayoffs(true, ...)` has written finalized clinch statuses — verifiable by checking that at least one `teamSeason.clinchedPlayoffs !== undefined` in cache before the emit.
- Pre-existing phase tests (`newPhaseBeforeDraft`, `newPhasePlayoffs`) pass unchanged. The hooks are additive; no existing assertions are affected.
- `tsc --noEmit` on both modified files passes with zero errors.
- Searching the codebase for `toUI("feedEvent"` still returns exactly one result: `src/worker/util/feedEvents.ts`. The hooks call `emitFeedEvent`, not `toUI` directly.

## Definition of Done

Two fire-and-forget hook lines added to two existing phase files. `SEASON_AWARD` fires after `doAwards` resolves. `PLAYOFF_CLINCH` fires after `updateClinchedPlayoffs(true, ...)` resolves. Both use `getSocialContext` then `emitFeedEvent`. No existing tests broken. No new files. `tsc --noEmit` clean. `toUI("feedEvent"` has exactly one callsite in the codebase.
