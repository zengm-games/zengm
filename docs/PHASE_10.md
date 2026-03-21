# Phase 10: GAME_END + INJURY Hooks

## Contract

When a game completes, a `GAME_END` FeedEvent fires carrying final game stats and post-game context assembled from Cache. When one or more players are injured during game processing, an `INJURY` FeedEvent fires. Both events are emitted after all stat writes are complete — context reflects the final, persisted game state, not any mid-game snapshot. Neither hook alters the return value or observable side effects of `cbSaveResults`.

## Depends on

- **Phase 8** — `emitFeedEvent(type, context)` exists in `src/worker/util/feedEvents.ts`
- **Phase 7** — `getSocialContext(eventType)` exists in `src/worker/views/socialContext.ts`

## Delivers

Additive changes only to `src/worker/core/game/play.ts`, specifically inside the `cbSaveResults()` closure.

No new files are created. No existing function signatures change. No existing return values change.

## cbSaveResults() Overview

`cbSaveResults(results: GameResults[], dayOver: boolean)` is defined as an inner `async` closure inside the top-level `play()` function in `src/worker/core/game/play.ts`. It is called by `cbSimGames()` once per simulated day, after the raw game results have been produced by `GameSim`.

The high-level sequence inside `cbSaveResults` is:

1. **Live sim setup** — if this is a play-by-play game, update the UI's live state and popover players.
2. **`writePlayerStats(results, conditions)`** — processes player-level stats across all games in `results`. This is where injuries are assigned: any player who gets injured in a game has their `p.injury` updated on the IDB player record. The function returns `{ injuryTexts, pidsInjuredOneGameOrLess, stopPlay }`. `injuryTexts` is an array with one entry per injured user-team player who was out more than one game. It is non-empty if and only if at least one such player was injured this batch.
3. **`writeTeamStats` + `writeGameStats`** — per-game writes, including attendance, team season records, and box score data.
4. **Schedule cleanup** — finished game IDs deleted from `idb.cache.schedule`.
5. **Playoffs / clinch updates** — `updatePlayoffSeries` or `team.updateClinchedPlayoffs`.
6. **`logEvent` for injury notification** — if `injuryTexts.length > 0`, fires a UI notification.
7. **Day-over processing** (if `dayOver`) — injury countdown, healed players, tragic deaths, free agent demands, auto-sign, AI trades.
8. **`toUI("mergeGames", ...)` or `recomputeLocalUITeamOvrs()`** — LeagueTopBar update.
9. **`advStats()`** — advanced stats recomputation.
10. **`toUI("realtimeUpdate", ...)`** — triggers UI page refresh.
11. **Recursion or terminal** — calls `cbNoGames` or `play(numDays - 1, ...)` to continue simulation.

Both hooks from this phase insert at the end of step 9 / before step 10 — after all stats are written and advanced stats recomputed, but before the UI refresh fires.

## GAME_END Hook

### Where to insert

After the `await advStats()` call and before the `toUI("realtimeUpdate", ...)` block. This placement guarantees that:

- Player stats, team stats, and game records are fully written to IDB.
- Advanced stats have been recomputed.
- The context assembled by `getSocialContext("GAME_END")` includes this game in `recentGames` (because `idb.getCopies.games` will now find it).

### Exact additive change

`GAME_END` must fire **once per individual game result**, not once per `cbSaveResults` batch. `cbSaveResults` receives a `results` array that may contain many games for a single simulated day. The hook must iterate that array and emit one event per entry:

```typescript
// --- GAME_END hook (Phase 10) ---
for (const result of results) {
	const homeTeam = result.team[0];
	const awayTeam = result.team[1];
	const eventMetadata = {
		gid: result.gid,
		homeScore: homeTeam.stat.pts,
		awayScore: awayTeam.stat.pts,
		homeName: homeTeam.name,
		awayName: awayTeam.name,
	};
	void getSocialContext("GAME_END")
		.then((context) => emitFeedEvent("GAME_END", context, eventMetadata))
		.catch((err) => console.error("[feedHook] failed to emit GAME_END", err));
}
// --- end GAME_END hook ---
```

Each `GAME_END` event is emitted with an `eventMetadata` payload carrying the game result (`gid`, `homeScore`, `awayScore`, `homeName`, `awayName`). This gives downstream agents precise per-game context rather than a generic batch signal.

`emitFeedEvent` must accept an optional third `eventMetadata` argument and include it on the `FeedEvent` record (see Phase 8 for signature). If the Phase 8 signature does not yet carry `eventMetadata`, add it as an optional parameter there.

This is a fire-and-forget call. `void` discards the returned Promise so `cbSaveResults` does not await it. The hook does not block any downstream work.

### Imports to add at the top of play.ts

```typescript
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
```

Both imports are additive — no existing import lines are modified.

## INJURY Hook

### Injury detection

`writePlayerStats` already does the injury detection work. Its return value includes:

```typescript
const { injuryTexts, pidsInjuredOneGameOrLess, stopPlay } =
	await writePlayerStats(results, conditions);
```

`injuryTexts` is populated with one entry per newly injured player on the user's team who is expected to miss more than one game. However, `injuryTexts` only covers user-team players — it is not a reliable signal for "did any player in the league get injured".

A more robust signal is to scan `results` directly. The game simulation marks injured players with `injury.newThisGame = true` on the in-memory player objects within the result. After `writePlayerStats` runs, these are written to IDB. The simplest check is:

```typescript
const anyInjury = results.some((result) =>
	result.team.some((t: any) =>
		t.player.some((p: any) => p.injury?.newThisGame === true),
	),
);
```

This reads the `results` array that is already in scope — no extra IDB query.

Alternatively, if the goal is only to emit for user-team injuries (consistent with how `injuryTexts` and the `logEvent("injuredList")` notification already work), use:

```typescript
const anyInjury = injuryTexts.length > 0;
```

**Recommended approach:** use `injuryTexts.length > 0` for v1. This is consistent with the existing notification logic immediately above the hook, avoids an extra scan of the results array, and matches the spirit of "noteworthy injury" (user-team, multi-game) rather than "any scrub tweaked an ankle". The behaviour can be expanded in a later phase.

### Conditional emit

```typescript
// --- INJURY hook (Phase 10) ---
if (injuryTexts.length > 0) {
	void getSocialContext("INJURY").then((context) =>
		emitFeedEvent("INJURY", context),
	);
}
// --- end INJURY hook ---
```

If no qualifying injuries occurred, this block is a no-op. The `INJURY` FeedEvent is not emitted for clean games.

### Placement relative to GAME_END

The INJURY hook fires immediately before or immediately after the GAME_END hook — both are in the same position in the function (after `advStats()`, before `toUI("realtimeUpdate")`). Order between them does not matter because both are fire-and-forget; neither awaits the other. The recommended order is INJURY first, then GAME_END, to match narrative logic (the injury happened during the game, the game ended after).

```typescript
await advStats();

// --- Phase 10 hooks ---
if (injuryTexts.length > 0) {
    void getSocialContext("INJURY").then((context) =>
        emitFeedEvent("INJURY", context),
    ).catch((err) => console.error("[feedHook] failed to emit INJURY", err));
}

for (const result of results) {
    const homeTeam = result.team[0];
    const awayTeam = result.team[1];
    const eventMetadata = {
        gid:       result.gid,
        homeScore: homeTeam.stat.pts,
        awayScore: awayTeam.stat.pts,
        homeName:  homeTeam.name,
        awayName:  awayTeam.name,
    };
    void getSocialContext("GAME_END").then((context) =>
        emitFeedEvent("GAME_END", context, eventMetadata),
    ).catch((err) => console.error("[feedHook] failed to emit GAME_END", err));
}
// --- end Phase 10 hooks ---

// If there was a play by play done for one of these games, get it
if (gidOneGame !== undefined && playByPlay) {
    // ...existing toUI("realtimeUpdate") block...
```

## Ordering: Stats First, Events After

Both hooks fire after `advStats()` has resolved. This is a hard requirement, not a style preference.

**Why it matters:**

- `idb.getCopies.games` is used by `getSocialContext` to populate `recentGames`. Games are written to IDB by `writeGameStats`, which runs early in `cbSaveResults`. By the time the hooks fire, this write is complete and the game is findable.
- `recentGames[0]` in the assembled context will be the game that just finished — agents can reference the final score and box-score data.
- `advStats()` recomputes derived stat columns that `getSocialContext` may include in player summaries. If the hooks fired before `advStats()`, some derived numbers would be one game stale.
- Injuries are written to IDB by `writePlayerStats` (step 2). The INJURY hook fires at step 9 — the player's injury record is already persisted and will appear correctly in the context if agents query for it.

**What "fire-and-forget" means here:**

`cbSaveResults` does not await the context assembly or the emit. The `void ... .then(...)` pattern schedules the async work but lets `cbSaveResults` continue immediately to `toUI("realtimeUpdate")`. From the game loop's perspective, the hooks have zero latency cost. The actual `getSocialContext` reads and the `emitFeedEvent` call happen asynchronously and complete after the game loop has moved on. This is acceptable because the Feed Worker (which eventually processes these events) runs independently of the game sim loop.

## Implementation Notes

**`results` batch size.** `cbSaveResults` receives a `results` array with one entry per game in the current simulated day. For a normal day of games this is many games at once — not one game per call. The `GAME_END` hook **iterates `results` and fires once per individual game**, not once per batch. This is required so that each `GAME_END` event carries precise per-game metadata (`gid`, `homeScore`, `awayScore`, `homeName`, `awayName`) rather than a generic batch signal. The iteration is a `for...of` loop; the fire-and-forget pattern still applies inside the loop — `cbSaveResults` does not await any individual emit.

**`injuryTexts` scope.** `injuryTexts` is declared and populated by `writePlayerStats` at the top of `cbSaveResults`. It is in scope for the entire rest of the function body — the INJURY hook can reference it directly without any additional destructuring.

**No new state.** Neither hook introduces any local variable, side effect, or mutation visible outside the hook block. The function's control flow is unchanged: it still falls through to `toUI("realtimeUpdate")` and then to the recursive `play()` call or `cbNoGames()` exactly as before.

**TypeScript.** `emitFeedEvent` is typed as `(type: FeedEventType, context: SocialContext): void`. `getSocialContext` returns `Promise<SocialContext>`. Both are already typed; no `any` casts are needed. `"GAME_END"` and `"INJURY"` must be members of the `FeedEventType` union defined in `src/common/types.feedEvent.ts` (Phase 1).

**No conditions on `gidOneGame` or `playByPlay`.** Both hooks fire regardless of whether this is a live play-by-play game or a batch sim. Feed agents receive events in both modes. If future work requires suppressing events during live sim, that filter belongs in the Feed Worker's agent selection step (Phase 14), not here.

**`conditions` not needed.** Unlike `logEvent`, `emitFeedEvent` does not take a `conditions` argument. The emit goes through `toUI("feedEvent")` which is not tab-targeted. No change to the function signature of `cbSaveResults` is required.

**Idempotence under forceWin re-simulation.** When `godMode.forceWin` is active, `cbSimGames` may re-run a game up to 2000 times before arriving at the forced result. Only the final result is pushed into `results` — `cbSaveResults` is called exactly once per batch regardless. The hooks fire exactly once.

## Verified by

- Processing a completed game batch results in exactly one `GAME_END` event with `context.teams` populated (non-empty array).
- Processing a game batch where the user's team has a player injured for more than one game results in exactly one `INJURY` event. Processing a clean game batch results in zero `INJURY` events.
- Both events fire after `advStats()` resolves — confirmed by asserting that `idb.getCopies.games` returns the completed game when called during context assembly.
- `context.recentGames[0]` in the `GAME_END` event matches the game that was just written to IDB (correct `gid`, correct scores).
- Removing both hook blocks entirely causes zero change to `cbSaveResults` return value and zero change to existing `toUI`, `logEvent`, `advStats`, and recursive `play()` calls — confirmed by diffing behaviour with and without the hooks.
- All pre-existing `game/play.ts` tests continue to pass unchanged.
- TypeScript compiles with zero errors after the import additions and hook insertions.

## Definition of Done

Both events fire correctly from `cbSaveResults`. `GAME_END` fires once **per individual game** in `results`, each carrying `eventMetadata` with `{ gid, homeScore, awayScore, homeName, awayName }`. `INJURY` fires conditionally when at least one user-team player is injured for more than one game. Both fire after all stat writes and `advStats()`. Context reflects post-game state. All hook callbacks are protected by `.catch()`. No new files. No changed signatures. No regressions.
