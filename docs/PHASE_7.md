# Phase 7: `getSocialContext()` Worker View

## Contract

A new Worker view function exists that assembles a fully typed `SocialContext` from Cache/IDB at call time. It can be called from any Worker trigger point and returns rich game context without side effects. The function is pure: it reads, maps, and returns — no store writes, no state mutation, no observable side effects.

## Depends on

- **Phase 1** — `SocialContext`, `FeedEventType`, `StatLeader`, `TeamSummary`, `PlayerSummary`, `GameResult`, `StandingEntry`, `TransactionSummary` types in `src/common/types.feedEvent.ts`

## Delivers

- `src/worker/views/socialContext.ts` — the view function
- `src/worker/views/index.ts` — updated to export `socialContext`

## Function Signature

```typescript
import type {
	FeedEventType,
	SocialContext,
	StatLeader,
} from "../../common/types.feedEvent.ts";

export async function getSocialContext(
	eventType: FeedEventType,
	liveStats?: {
		score: [number, number];
		quarter: number;
		statLeaders: StatLeader[];
	},
): Promise<SocialContext>;
```

`eventType` is accepted for future conditional logic (e.g., skipping expensive reads for lightweight events). It is not used in the v1 implementation but must be present in the signature so callers are forward-compatible.

## Data Sources

| `SocialContext` field | Store                      | Access pattern                                                 | Limit                 |
| --------------------- | -------------------------- | -------------------------------------------------------------- | --------------------- |
| `liveGame`            | — (from `liveStats` arg)   | No IDB query; populated directly if arg present                | —                     |
| `teams`               | `idb.cache.teamSeasons`    | `getAll()`, filter to current season                           | All active teams      |
| `players`             | `idb.cache.players`        | `indexGetAll("playersByTid", [0, Infinity])`                   | Top 20 by OVR         |
| `recentGames`         | `idb.getCopies.games`      | `{ season: currentSeason }`, sorted descending by `gid`        | Last 5 completed      |
| `standings`           | Derived from `teamSeasons` | Same read as `teams`, no second query                          | All active teams      |
| `transactions`        | `idb.league`               | `idb.league.getAll('events')`, filter by type + current season | Last 10 events by eid |

## Implementation

```typescript
// READ ONLY — no writes permitted in this view

import { PLAYER } from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	FeedEventType,
	GameResult,
	PlayerSummary,
	SocialContext,
	StandingEntry,
	StatLeader,
	TeamSummary,
	TransactionSummary,
} from "../../common/types.feedEvent.ts";

export async function getSocialContext(
	eventType: FeedEventType,
	liveStats?: {
		score: [number, number];
		quarter: number;
		statLeaders: StatLeader[];
	},
): Promise<SocialContext> {
	const currentSeason = g.get("season");
	const confs = g.get("confs", currentSeason);

	// ── 1. teamSeasons — single read, used for both `teams` and `standings` ──
	const allTeamSeasons = await idb.cache.teamSeasons.getAll();
	const currentTeamSeasons = allTeamSeasons.filter(
		(ts) => ts.season === currentSeason && !ts.disabled,
	);

	// Build a tid → conference name lookup from g.get("confs")
	const allTeams = await idb.cache.teams.getAll();
	const tidToConfName: Record<number, string> = {};
	for (const t of allTeams) {
		if (t.disabled) continue;
		const conf = confs.find((c) => c.cid === t.cid);
		tidToConfName[t.tid] = conf?.name ?? "";
	}

	// ── teams ──
	// Sort by win% descending to assign overall standing rank
	const sorted = [...currentTeamSeasons].sort((a, b) => {
		const pctA = a.won + a.lost > 0 ? a.won / (a.won + a.lost) : 0;
		const pctB = b.won + b.lost > 0 ? b.won / (b.won + b.lost) : 0;
		return pctB - pctA;
	});

	const tidToStanding: Record<number, number> = {};
	sorted.forEach((ts, i) => {
		tidToStanding[ts.tid] = i + 1;
	});

	const teams: TeamSummary[] = currentTeamSeasons.map((ts) => ({
		tid: ts.tid,
		name: ts.name,
		abbrev: ts.abbrev,
		wins: ts.won,
		losses: ts.lost,
		standing: tidToStanding[ts.tid] ?? 0,
	}));

	// ── standings ──
	// Derived from the same currentTeamSeasons — no second read
	const standings: StandingEntry[] = sorted.map((ts) => ({
		tid: ts.tid,
		name: ts.name,
		abbrev: ts.abbrev,
		wins: ts.won,
		losses: ts.lost,
		pct: ts.won + ts.lost > 0 ? ts.won / (ts.won + ts.lost) : 0,
		conf: tidToConfName[ts.tid] ?? "",
	}));

	// ── 2. players ──
	// Active rostered players: tid >= 0 and tid !== PLAYER.FREE_AGENT
	const allPlayers = await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	]);

	// Build a tid → team name lookup from currentTeamSeasons
	const tidToName: Record<number, string> = {};
	for (const ts of currentTeamSeasons) {
		tidToName[ts.tid] = ts.name;
	}

	// Sort by latest season OVR descending, limit to top 20
	const activePlayers = allPlayers
		.filter((p) => p.tid >= 0 && p.tid !== PLAYER.FREE_AGENT)
		.map((p) => {
			const latestRatings = p.ratings.at(-1);
			const ovr = latestRatings?.ovr ?? 0;
			const latestStats = p.stats.at(-1);
			return { p, ovr, latestStats };
		})
		.sort((a, b) => b.ovr - a.ovr)
		.slice(0, 20);

	const players: PlayerSummary[] = activePlayers.map(
		({ p, ovr, latestStats }) => ({
			pid: p.pid,
			name: `${p.firstName} ${p.lastName}`,
			tid: p.tid,
			teamName: tidToName[p.tid] ?? "",
			position: p.ratings.at(-1)?.pos ?? "",
			ovr,
			seasonAverages: {
				pts: latestStats?.pts ?? 0,
				reb: latestStats?.trb ?? 0,
				ast: latestStats?.ast ?? 0,
			},
		}),
	);

	// ── 3. recentGames ──
	const allGames = await idb.getCopies.games(
		{ season: currentSeason },
		"noCopyCache",
	);
	// Completed games only (have a score); most recent first
	const completedGames = allGames
		.filter((g) => g.won !== undefined)
		.sort((a, b) => b.gid - a.gid)
		.slice(0, 5);

	const recentGames: GameResult[] = completedGames.map((game) => ({
		gid: game.gid,
		homeName: game.teams[0]?.name ?? "",
		awayName: game.teams[1]?.name ?? "",
		homeScore: game.teams[0]?.pts ?? 0,
		awayScore: game.teams[1]?.pts ?? 0,
		date: game.season?.toString() ?? "",
	}));

	// ── 4. transactions ──
	// Read historical events from the league IDB store directly.
	// idb.cache does not expose a getData/getAll for events — use idb.league instead.
	// EventBBGM does not have a .day property; filter by season only.
	const eventTypes = new Set(["trade", "freeAgent", "release", "injured"]);

	const allEvents = await idb.league.getAll("events");
	const recentEvents = allEvents
		.filter((ev) => eventTypes.has(ev.type) && ev.season === currentSeason)
		.slice(-10); // Keep at most 10 most-recent entries (events are ordered by eid asc)

	const typeMap: Record<string, TransactionSummary["type"]> = {
		trade: "trade",
		freeAgent: "signing",
		release: "release",
		injured: "injury",
	};

	const transactions: TransactionSummary[] = recentEvents.map((ev) => ({
		type: typeMap[ev.type] ?? "signing",
		description: ev.text ?? "",
		timestamp: ev.eid ?? 0,
	}));

	// ── 5. liveGame — from arg only, no IDB ──
	const liveGame = liveStats
		? {
				score: liveStats.score,
				quarter: liveStats.quarter,
				statLeaders: liveStats.statLeaders,
			}
		: undefined;

	return {
		...(liveGame !== undefined ? { liveGame } : {}),
		teams,
		players,
		recentGames,
		standings,
		transactions,
	};
}

export default getSocialContext;
```

## HALFTIME Live Stats Path

The `liveGame` field in `SocialContext` has two distinct assembly paths depending on whether `liveStats` is passed:

**HALFTIME path (liveStats provided):**

The Phase 9 HALFTIME hook calls `getSocialContext("HALFTIME", { score, quarter, statLeaders })`. The `liveStats` argument arrives already populated with the current score, quarter number, and the top-3 stat leaders for the half. `getSocialContext` copies these values directly into `liveGame` — no IDB access, no extra reads. The stat leaders array is expected to contain exactly 3 entries: the pts leader, reb leader, and ast leader, assembled by the caller from the live sim state.

**All other event types (liveStats absent):**

`getSocialContext` is called without a second argument. The `liveStats` parameter is `undefined`. The returned `SocialContext` omits `liveGame` entirely (the field is not set). TypeScript models this correctly because `liveGame` is typed as optional (`liveGame?`).

This design ensures that:

- The HALFTIME hook never pays a double-read penalty: live stats flow in as a parameter, not from IDB
- Non-live event hooks never include a stale or nonsensical `liveGame` value
- The branching is a simple `liveStats !== undefined` guard — no event-type switch needed

**liveGame.statLeaders contract:**

The caller (Phase 9) is responsible for supplying exactly 3 leaders in this order: `[ptsLeader, rebLeader, astLeader]`. `getSocialContext` does not validate the array length or reorder entries — it passes them through verbatim.

## Registering the View

`getSocialContext` is not a UI view in the traditional sense (it has no URL route and no `updateEvents` parameter). It is exported as a named function for direct import by Worker hook code, and also added to `src/worker/views/index.ts` as `socialContext` so it is discoverable alongside other views.

Add this line to `src/worker/views/index.ts` in alphabetical order between `schedule` and `scheduleEditor`:

```typescript
export { default as socialContext } from "./socialContext.ts";
```

Full surrounding context in `index.ts`:

```typescript
export { default as schedule } from "./schedule.ts";
export { default as socialContext } from "./socialContext.ts"; // ← add here
export { default as scheduleEditor } from "./scheduleEditor.ts";
```

Worker hook code that calls this function imports it directly — it does not go through the `toWorker("runView", ...)` dispatcher because it is not a page view:

```typescript
import { getSocialContext } from "../views/socialContext.ts";

// Inside a GAME_END hook:
const context = await getSocialContext("GAME_END");

// Inside the HALFTIME hook:
const context = await getSocialContext("HALFTIME", {
	score: [homeScore, awayScore],
	quarter: currentQuarter,
	statLeaders: buildHalftimeLeaders(liveSimState),
});
```

## Implementation Notes

**No mutations rule.** The comment `// READ ONLY — no writes permitted in this view` at the top of the file is a permanent lint signal. The file must never call `idb.cache.put()`, `idb.cache.add()`, or any other write method. Code reviewers should reject any PR that adds a write to this file.

**`PlayerSummary.ovr` (Phase 3a dependency).** Phase 3a's `initializeFeedAccounts` and `syncPlayerAccounts` functions require `ovr: number` on `PlayerSummary` to apply the `PLAYER_OVR_THRESHOLD = 65` activation gate. `getSocialContext` populates `ovr` from `player.ratings.at(-1).ovr`. This field is not defined on the `PlayerSummary` type in Phase 1 — it must be added there as part of Phase 3a's type migration, or accepted as a local extension here. The preferred approach is to add `ovr: number` to `PlayerSummary` in `src/common/types.feedEvent.ts` at the start of Phase 3a work so that the type and the implementation stay in sync.

**Parallelism.** The four IDB reads (`teamSeasons`, `players`, `games`, `events`) are independent. In a performance-sensitive context they can be fired in parallel with `Promise.all`:

```typescript
const [allTeamSeasons, allPlayers, allGames, allEvents, allTeams] =
	await Promise.all([
		idb.cache.teamSeasons.getAll(),
		idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
		idb.getCopies.games({ season: currentSeason }, "noCopyCache"),
		idb.league.getAll("events"), // idb.cache does not expose events; use idb.league
		idb.cache.teams.getAll(),
	]);
```

The sequential form in the Implementation section above is shown for readability. The parallelised form is preferred in production.

**Context size budget.** The entire `SocialContext` object is serialized into a Vercel API call body. Keep it compact:

| Field                  | Hard limit                                            |
| ---------------------- | ----------------------------------------------------- |
| `players`              | 20 entries                                            |
| `recentGames`          | 5 entries                                             |
| `transactions`         | Last 10 events from current season (via `idb.league`) |
| `teams` / `standings`  | All active teams (typically 30 or fewer)              |
| `liveGame.statLeaders` | Exactly 3 entries                                     |

**`idb.getCopies.games` vs `idb.cache.games`.** Completed game records are flushed to IDB and are not in the in-memory cache. Always use `idb.getCopies.games` (not `idb.cache.games`) to read them. The `"noCopyCache"` flag avoids a redundant deep-copy since the returned objects are never mutated.

**Standing rank.** `TeamSummary.standing` is an overall league rank (1 = best record). `StandingEntry.conf` is the conference name string (e.g. `"Eastern Conference"`), not a numeric id. The conf name is resolved by joining `g.get("confs")` against `idb.cache.teams` (which stores `cid` per team).

**Event type mapping.** ZenGM internal event types (`"freeAgent"`, `"release"`, `"injured"`, `"trade"`) are remapped to the `TransactionSummary` union (`"signing"`, `"release"`, `"injury"`, `"trade"`). Any event type not in the map is silently dropped by the `eventTypes` set filter before the map step.

**`idb.cache` does not expose events.** The in-memory cache layer (`idb.cache`) only covers stores that are fully loaded into memory for the active game session. Historical event records are not in that set. Always use `idb.league.getAll("events")` (or a scoped index query on the `idb.league` store) to read event history. Never call `idb.cache.events.getAll()` or `idb.cache.events.getData()`.

**Worker hook error isolation.** All worker hook callbacks (the `.then(...)` chains calling `getSocialContext` and `emitFeedEvent`) must be wrapped in try/catch or have a `.catch()` handler. A crash inside a hook must NOT propagate to the game engine. Log errors to the console only:

```typescript
void getSocialContext("GAME_END")
	.then((context) => emitFeedEvent("GAME_END", context))
	.catch((err) => console.error("[feedHook] failed to emit GAME_END", err));
```

**No `ev.day` on EventBBGM.** ZenGM game events do not have a `.day` property. Use `g.get("season")` and `g.get("phase")` to understand temporal context. The transaction filter uses `ev.season === currentSeason` as the recency signal; `ev.day`-based windowing must not be used.

## Verified by

- Calling `getSocialContext("GAME_END")` returns a `SocialContext` with non-empty `teams` and `standings` arrays
- Calling `getSocialContext("HALFTIME", { score: [54, 51], quarter: 2, statLeaders: [...] })` returns a context where `liveGame` is populated with the exact values passed in
- Calling `getSocialContext("GAME_END")` (no `liveStats`) returns a context where `liveGame` is `undefined` (field absent from the object)
- Calling does not mutate any Cache record — confirmed by verifying no `put()`, `add()`, or `delete()` calls exist anywhere in `socialContext.ts`
- The return value satisfies `Promise<SocialContext>` with zero TypeScript errors when `tsc --noEmit` is run
- Running the function twice in sequence on the same game state produces identical output (pure/deterministic)

## Definition of Done

One file. Pure reads. No mutations. Typed return. Exports from `index.ts`. `liveGame` populated if and only if `liveStats` is provided. Players capped at 20 by OVR. Games capped at 5. Transactions read from `idb.league.getAll("events")`, filtered by current season, capped at 10 most-recent entries. No `idb.cache.events` calls. No `ev.day` references. All hook callbacks protected by `.catch()`. Compiles clean with zero `any`.
