# Phase 9: HALFTIME Hook

## Contract

When the basketball game sim completes period 2, a `HALFTIME` FeedEvent fires carrying live score and first-half stat data assembled from the in-memory `GameSim` state — without querying IndexedDB. The event is fire-and-forget: `simRegulation()` does not await it, and the game simulation continues unblocked.

## Depends on

- Phase 8 (`src/worker/util/feedEvents.ts`) — `emitFeedEvent(type, context)` must exist
- Phase 7 (`src/worker/views/socialContext.ts`) — `getSocialContext(type, liveStats?)` must exist and accept a `liveStats` argument that populates `context.liveGame` without an IDB query

## Delivers

- Additive change to `src/worker/core/GameSim.basketball/index.ts` → `simRegulation()`

No new files. No schema changes. No new exports. One insertion in one method.

---

## GameSim Architecture Overview

`GameSim.basketball` is the live simulation class. Its `run()` method drives the full game:

```
run()
  └── simRegulation()        // simulates all regulation periods
        └── [loop over periods 1..numPeriods]
              └── simPossession()  // simulates each possession
  └── simOvertime()          // if tied at end of regulation
  └── checkGameWinner()
```

`simRegulation()` is synchronous. It runs a `while (!this.elamDone)` loop driven by `period`, incrementing from 1 to `this.numPeriods`. After each period completes (except the final one), it pushes a new `0` onto `this.team[t].stat.ptsQtrs` to begin tracking the next quarter.

**Score state** is held in two places simultaneously:

| Field                       | Contents                                                            |
| --------------------------- | ------------------------------------------------------------------- |
| `this.team[t].stat.pts`     | Cumulative total points for team `t` (updated by `recordStat`)      |
| `this.team[t].stat.ptsQtrs` | Array of per-quarter point totals; index 0 = Q1, index 1 = Q2, etc. |

Team index 0 is the home team; index 1 is the away team. This follows the `teams` array passed to the constructor.

**Player stats** are stored on each `PlayerGameSim` object's `.stat` property. Players live in `this.team[t].player[]` (all players on the roster for team `t`). All counting stats — `pts`, `orb`, `drb`, `ast`, `stl`, `blk`, `tov` — are accumulated on `.stat` throughout the game via `recordStat()`. By the time period 2 ends, every player's `.stat.pts`, `.stat.orb`, `.stat.drb`, and `.stat.ast` reflect their first-half totals.

`this.numPeriods` is typically 4 (standard basketball). The HALFTIME hook fires specifically when `period === 2` (i.e., `this.numPeriods / 2` for a standard game).

---

## Live Stats Assembly

After period 2 completes, the following fields are available directly in memory with no IDB access:

**Team scores:**

```typescript
const homeScore = this.team[0].stat.pts; // cumulative after 2 quarters
const awayScore = this.team[1].stat.pts;
```

**Per-quarter breakdown** (for halftime context):

```typescript
// Q1 and Q2 points for each team
this.team[0].stat.ptsQtrs[0]; // home Q1
this.team[0].stat.ptsQtrs[1]; // home Q2
this.team[1].stat.ptsQtrs[0]; // away Q1
this.team[1].stat.ptsQtrs[1]; // away Q2
```

**Player stat leaders** — assembled by iterating `this.team[0].player` and `this.team[1].player`:

```typescript
// All players across both teams:
const allPlayers = [
	...this.team[0].player.map((p) => ({ ...p, teamIndex: 0 })),
	...this.team[1].player.map((p) => ({ ...p, teamIndex: 1 })),
];
```

Each `PlayerGameSim` carries:

- `p.id` — player ID
- `p.name` — player display name
- `p.stat.pts` — points scored so far this game
- `p.stat.orb + p.stat.drb` — total rebounds (orb = offensive, drb = defensive)
- `p.stat.ast` — assists

The `liveStats` object passed to `getSocialContext` takes this shape (from Phase 7's contract):

```typescript
const liveStats = {
	score: [homeScore, awayScore] as [number, number],
	quarter: 2,
	statLeaders: assembleStatLeaders(this),
};
```

`getSocialContext("HALFTIME", liveStats)` uses `liveStats` to populate `context.liveGame` without touching IDB. All other context fields (team season records, standings, recent games) are read from IDB cache as usual — this is acceptable since that data is background context, not live sim data.

---

## Hook Implementation

The insertion point is inside `simRegulation()`, in the gap between period 2 ending and period 3 beginning. In the current loop structure, after the inner `while (this.t > 0 && !this.elamDone)` loop exits and before `period += 1`, the code resets the clock and logs the new period event. The HALFTIME hook goes immediately after the period-2 possession loop exits and before the state reset for period 3.

**Before (current `simRegulation()` structure):**

```typescript
simRegulation() {
    let period = 1;
    const wonJump = this.jumpBall();

    while (!this.elamDone) {
        if (period !== 1) {
            this.doSubstitutionsIfDeadBall({ type: "newPeriod" });
        }

        const finalPeriod = period === this.numPeriods;

        // ... possession assignments ...

        this.checkElamEnding();
        while (this.t > 0 && !this.elamDone) {
            this.simPossession();
            this.checkElamEnding();
        }

        if (finalPeriod) {
            break;
        }

        period += 1;

        this.team[0].stat.ptsQtrs.push(0);
        this.team[1].stat.ptsQtrs.push(0);
        this.foulsThisQuarter = [0, 0];
        // ... clock reset, period log event ...
    }
}
```

**After (with HALFTIME hook added):**

```typescript
simRegulation() {
    let period = 1;
    const wonJump = this.jumpBall();

    while (!this.elamDone) {
        if (period !== 1) {
            this.doSubstitutionsIfDeadBall({ type: "newPeriod" });
        }

        const finalPeriod = period === this.numPeriods;

        // ... possession assignments ...

        this.checkElamEnding();
        while (this.t > 0 && !this.elamDone) {
            this.simPossession();
            this.checkElamEnding();
        }

        if (finalPeriod) {
            break;
        }

        // --- HALFTIME HOOK (additive, fire-and-forget) ---
        // Only fire during live/interactive game sessions — not during batch sim.
        if (period === 2 && local.get("liveGameInProgress")) {
            const liveStats = {
                score:       [this.team[0].stat.pts, this.team[1].stat.pts] as [number, number],
                quarter:     2,
                statLeaders: assembleStatLeaders(this),
            };
            void getSocialContext("HALFTIME", liveStats)
                .then(context => emitFeedEvent("HALFTIME", context))
                .catch(err => console.error("[feedHook] failed to emit HALFTIME", err));
        }
        // --- END HALFTIME HOOK ---

        period += 1;

        this.team[0].stat.ptsQtrs.push(0);
        this.team[1].stat.ptsQtrs.push(0);
        this.foulsThisQuarter = [0, 0];
        // ... clock reset, period log event ...
    }
}
```

The `if (period === 2)` guard ensures the hook fires exactly once per game, after Q2 ends and before Q3 state is initialized. It does not fire in overtime (the overtime path calls `simOvertime()` separately, never re-entering this loop at period 2).

**Required imports to add at the top of `index.ts`:**

```typescript
import { getSocialContext } from "../../views/socialContext.ts";
import { emitFeedEvent } from "../../util/feedEvents.ts";
import { local } from "../../util/index.ts";
```

---

## StatLeader Assembly

`assembleStatLeaders` is a module-level helper (not a class method) that takes a `GameSim` instance and returns the `StatLeader[]` array expected by `SocialContext.liveGame.statLeaders`. It iterates all players in both teams and finds the leader in each of three categories.

```typescript
function assembleStatLeaders(sim: GameSim): StatLeader[] {
	const allPlayers = [
		...sim.team[0].player.map((p) => ({ p, tid: sim.team[0].id })),
		...sim.team[1].player.map((p) => ({ p, tid: sim.team[1].id })),
	];

	const topScorer = allPlayers.reduce((best, cur) =>
		cur.p.stat.pts > best.p.stat.pts ? cur : best,
	);
	const topRebounder = allPlayers.reduce((best, cur) =>
		cur.p.stat.orb + cur.p.stat.drb > best.p.stat.orb + best.p.stat.drb
			? cur
			: best,
	);
	const topAssister = allPlayers.reduce((best, cur) =>
		cur.p.stat.ast > best.p.stat.ast ? cur : best,
	);

	return [
		{
			pid: topScorer.p.id,
			name: topScorer.p.name,
			stat: "pts",
			value: topScorer.p.stat.pts,
		},
		{
			pid: topRebounder.p.id,
			name: topRebounder.p.name,
			stat: "reb",
			value: topRebounder.p.stat.orb + topRebounder.p.stat.drb,
		},
		{
			pid: topAssister.p.id,
			name: topAssister.p.name,
			stat: "ast",
			value: topAssister.p.stat.ast,
		},
	];
}
```

**Key details:**

- `sim.team[t].player` is the full roster array for team `t`, not just players on the court. All players who have seen any game time will have non-zero stats; benchwarmers with zero minutes will simply have all-zero stats and will never win a category unless everyone on both teams has zero (an edge case in practice).
- Rebounds are `orb + drb` (offensive + defensive). There is no single `reb` field accumulated by `recordStat` — the split must be summed here.
- The function uses `reduce` rather than `sort` to avoid mutating the player arrays.
- If all players in a category have the same value (e.g. all have 0 assists in the first possession), `reduce` returns the first player encountered. This is acceptable — the halftime tweet reads naturally even if it says "0 assists leader."
- `StatLeader` is the type from Phase 1 (`src/common/types.feedEvent.ts`). It carries `{ pid, name, stat, value }`.

---

## Implementation Notes

### Async in a synchronous method

`simRegulation()` is synchronous. `getSocialContext()` and `emitFeedEvent()` are async (they read from IDB and call `toUI()`). The pattern is explicit fire-and-forget:

```typescript
void getSocialContext("HALFTIME", liveStats).then((context) =>
	emitFeedEvent("HALFTIME", context),
);
```

`void` suppresses the unhandled-promise lint warning and makes the intent explicit. The `Promise` is not awaited. The game simulation continues immediately to period 3 setup. The event reaches the UI asynchronously — this is intentional and matches the architecture of all other feed events in Phases 10–13.

There is no error propagation concern: if `getSocialContext` or `emitFeedEvent` throws, the unhandled rejection is logged by the runtime but does not affect the game sim. A `.catch(console.error)` can be chained if log visibility is desired, but it is not required by the contract.

### IDB-free path for liveGame

`getSocialContext("HALFTIME", liveStats)` receives the `liveStats` object as its second argument. Per Phase 7's contract, when `liveStats` is provided, `getSocialContext` populates `context.liveGame` directly from that object rather than querying IDB. This is the only field in `SocialContext` that carries live sim data.

All other fields in `SocialContext` (`teams`, `standings`, `recentGames`, `transactions`) are assembled by `getSocialContext` from their respective stores — `transactions` specifically comes from `idb.league.getAll("events")`, not `idb.cache`. This is acceptable: those fields carry season-level background context, not per-possession data. A small IDB-read latency for background fields does not affect correctness.

**Note on transaction data:** If the hook needs transaction details (e.g. recent trades), those come from the `EventBBGM` payload itself — the `event` object available in the hook context — not from `idb.cache.events`. Do not attempt to call `idb.cache.events.getData()` or `idb.cache.events.getAll()` from within a hook; the cache does not expose that interface for events.

**Rate-limiting / event flood prevention:** If multiple HALFTIME-adjacent events could fire in the same game phase tick, they should be batched or deduplicated. The `if (period === 2)` guard already ensures at most one HALFTIME event per game. For hooks in other phases that could fire repeatedly in a tight loop (e.g. per-possession or per-transaction), add a debounce or pick only the most significant event per phase tick. Do not send a feed event for every individual transaction if several fire in the same tick.

### No state mutation

The hook reads from GameSim state; it does not write to it. Specifically:

- No `recordStat()` calls
- No modifications to `this.team[t].stat.*`
- No modifications to `this.playersOnCourt`
- No changes to `this.t`, `this.o`, `this.d`, or any period/clock state

The hook cannot affect simulation outcomes. Removing it entirely produces bit-identical game results.

### Guard condition

The `if (period === 2 && local.get("liveGameInProgress"))` guard has two parts:

1. **`local.get("liveGameInProgress")`** — ensures HALFTIME events are only emitted during an interactive (live, play-by-play) game session. When a full season is simulated quickly in batch mode, `liveGameInProgress` is `false` and no halftime feed events fire. This prevents flooding the feed with events during batch simulation. The `local` import must be added alongside the other imports at the top of `index.ts`.

2. **`period === 2`** — the canonical halftime check. It does not use `this.numPeriods / 2` because:
   - `this.numPeriods` is configurable (ZenGM supports custom quarter counts), and "halftime" is semantically defined as after Q2 in basketball regardless of total quarter count.
   - The guard should be simple and explicit — a reader should immediately understand when the hook fires.

If a game has only 2 periods (`this.numPeriods === 2`), then `finalPeriod` is true at `period === 2`, the loop breaks before reaching the hook, and no `HALFTIME` event fires. This is correct: a 2-period game has no halftime break between periods in the regulation loop.

### Elam Ending edge case

In Elam Ending mode (`this.elam === true`), `this.elamDone` can become `true` during a possession in Q4 or later. The `while (!this.elamDone)` outer loop exits early if the target is reached before Q2 ends. If somehow Elam ends during Q2, `period` is still 1 at that point (Elam typically activates in Q4), so the hook does not fire. If Elam ends mid-Q3, the period 2 hook has already fired correctly. No special-casing needed.

---

## Verified by

- Simulating a standard 4-quarter game results in exactly one `HALFTIME` event emitted. Confirmed by: (a) counting `emitFeedEvent` calls with `type === "HALFTIME"` during a full game sim, and (b) verifying the count is 1, not 0, not 2.
- The emitted event's `context.liveGame` is populated with the score at the end of period 2. Confirmed by: capturing the `context` argument passed to `emitFeedEvent` and asserting `context.liveGame.score[0] + context.liveGame.score[1] > 0` and that the values match `this.team[0].stat.pts` / `this.team[1].stat.pts` at the moment of emission.
- No IDB query is made in the `liveGame` assembly path. Confirmed by: asserting that no `idb.cache.*` call occurs between the `if (period === 2)` branch entry and the construction of the `liveStats` object. The IDB calls that do occur (for `teams`, `standings`, etc.) are in `getSocialContext`, not in the score/stat-leader assembly.
- All pre-existing `GameSim.basketball` tests continue to pass. The hook is purely additive — removing it yields identical game outcomes. Run the existing test suite with the hook present to confirm no regressions.

---

## Definition of Done

One `HALFTIME` FeedEvent fires after period 2, before period 3 begins — but only when `local.get("liveGameInProgress")` is truthy. No event fires during batch season simulation. The event's `context.liveGame` carries the live score and first-half stat leaders assembled entirely from in-memory `GameSim` state. No IDB query is made to populate `liveGame`. Transaction data in `context` comes from `idb.league.getAll("events")` (not `idb.cache`). The hook chain includes a `.catch()` handler so errors are logged but never propagate to the game sim. The game simulation is not blocked or delayed. All pre-existing `GameSim.basketball` tests pass unchanged.
