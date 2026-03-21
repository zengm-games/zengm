# Agent Twitter Feed — Build Phases

Each Phase is a self-contained unit of work that delivers one architectural commitment. The system is in a valid, working state at the end of every Phase. Tests verify the contract, not the implementation.

---

## Dependency Table

| Phase | Name | Depends on | Can run in parallel with |
|---|---|---|---|
| **1** | Shared Types | — | — |
| **2** | Agent Persona Configs | 1 | 3, 4, 5, 7 |
| **3** | socialFeedDb | 1 | 2, 4, 5, 7 |
| **4** | `post` Tool | 1 | 2, 3, 5, 7 |
| **5** | `generatePlayerImage` Tool | 1 | 2, 3, 4, 7 |
| **6** | Vercel `/api/feed` Endpoint | 2, 4, 5 | 7, 8, 9, 10, 11, 12, 13 |
| **7** | `getSocialContext()` Worker View | 1 | 2, 3, 4, 5 |
| **8** | `emitFeedEvent()` Utility | 7 | 3, 4, 5, 6, 14 |
| **9** | HALFTIME Hook | 8 | 10, 11, 12, 13 |
| **10** | GAME_END + INJURY Hooks | 8 | 9, 11, 12, 13 |
| **11** | TRADE_ALERT Hook | 8 | 9, 10, 12, 13 |
| **12** | DRAFT_PICK Hook | 8 | 9, 10, 11, 13 |
| **13** | SEASON_AWARD + PLAYOFF_CLINCH Hooks | 8 | 9, 10, 11, 12 |
| **14** | Feed Worker Skeleton + Agent Selection | 2 | 6, 9, 10, 11, 12, 13 |
| **15** | Feed Worker → Vercel Fetch | 14, 6 | 9, 10, 11, 12, 13 |
| **16** | Feed Worker → IDB Write + UI Notify | 15, 3 | 9, 10, 11, 12, 13 |
| **17** | UI Relay — `feedEventHandler.ts` | 8, 16 | — |
| **18** | SocialFeed Panel | 17, 3 | — |

---

## Dependency Graph

```
Phase 1 (Types)
├── Phase 2 (Agent Configs) ────────────────────────────────────────┐
├── Phase 3 (socialFeedDb) ──────────────────────────────────────┐  │
├── Phase 4 (post Tool) ───────────────────────┐                 │  │
├── Phase 5 (generatePlayerImage Tool) ───────┤                 │  │
│                                              └── Phase 6 (/api/feed) ─────────────┐
└── Phase 7 (getSocialContext)                                    │  │               │
        └── Phase 8 (emitFeedEvent)                              │  │               │
                ├── Phase 9  (HALFTIME hook) ─────────────────────────────────────┐ │
                ├── Phase 10 (GAME_END+INJURY hooks) ──────────────────────────┐  │ │
                ├── Phase 11 (TRADE_ALERT hook) ───────────────────────────┐   │  │ │
                ├── Phase 12 (DRAFT_PICK hook) ────────────────────────┐   │   │  │ │
                ├── Phase 13 (SEASON_AWARD+PLAYOFF hooks) ─────────┐   │   │   │  │ │
                └── Phase 17 (UI Relay) ◄────────────────────────────────────────┘ │ │
                                                                    │   │   │   │  │ │
                                                          Phase 14 (Worker Skeleton)│ │
                                                                  └── Phase 15 (Worker Fetch) ◄┘
                                                                          └── Phase 16 (Worker IDB+Notify)
                                                                                  │        │
                                                                            Phase 17 ◄──────┘
                                                                                  │
                                                                            Phase 18 (Panel) ◄── Phase 3
```

---

## Phase 1: Shared Types

**Contract:** A single source-of-truth types file exists that defines every data shape used across the feed system. All subsequent phases import from it — none define their own.

**Depends on:** Nothing.

**Delivers:**
- `src/common/types.feedEvent.ts`

**Types defined:** `FeedEventType`, `FeedEvent`, `SocialContext`, `AgentConfig`, `GeneratedPost`, `ThreadRecord`, `StatLeader`, `TeamSummary`, `PlayerSummary`, `GameResult`, `StandingEntry`, `TransactionSummary`

**Verified by:**
- File compiles with zero TypeScript errors and zero `any`
- Every field in `GeneratedPost` that is nullable is explicitly typed as `T | null`, not `T | undefined`
- `FeedEventType` is a union of exactly 8 string literals matching the event table in the architecture doc

**Definition of done:** One file. Compiles. No `any`. All 8 event types present.

---

## Phase 2: Agent Persona Configs

**Contract:** Every agent archetype has a valid config file that can be loaded and validated against `AgentConfig`. No agent triggers on an undefined event type.

**Depends on:** Phase 1 (AgentConfig type).

**Delivers:**
- `src/data/socialAgents/journalists/sham_charania.json`
- `src/data/socialAgents/fans/homer.json`
- `src/data/socialAgents/fans/stat_nerd.json`
- `src/data/socialAgents/fans/bandwagon.json`
- `src/data/socialAgents/fans/hater.json`
- `src/data/socialAgents/players/template.json`
- `src/data/socialAgents/orgs/template.json`

**Verified by:**
- Every config file parses as valid JSON
- Every config validates against `AgentConfig` — no missing required fields, no unknown fields
- The union of all `triggers` arrays covers all 8 `FeedEventType` values
- `postProbability` is between 0 and 1 in every config
- `replyEligible` is `false` in every config (v1 constraint)

**Definition of done:** All configs load and validate. Every event type has at least one agent that will respond to it.

---

## Phase 3: socialFeedDb

**Contract:** Posts and threads can be written to and read from `socialFeedDb` without touching or depending on the league's IndexedDB. The schema is stable — no migration will be needed within v1.

**Depends on:** Phase 1 (GeneratedPost, ThreadRecord types).

**Delivers:**
- `src/ui/db/socialFeedDb.ts`

**Exports:**
```typescript
addPost(post: GeneratedPost): Promise<void>
getPosts(limit?: number): Promise<GeneratedPost[]>
addThread(thread: ThreadRecord): Promise<void>
getThread(threadId: string): Promise<ThreadRecord | undefined>
clearFeed(): Promise<void>
```

**Verified by:**
- `addPost` followed by `getPosts` returns the same post with all fields intact
- No operation in this file touches the league IDB — confirmed by checking that `idb.league` is never imported
- `clearFeed` results in `getPosts` returning `[]`
- Opening `socialFeedDb` when no league is active does not throw
- A `GeneratedPost` with a null `imageUrl` round-trips correctly — null is not coerced to undefined or empty string

**Definition of done:** All helpers work. League DB provably untouched.

---

## Phase 4: `post` Tool

**Contract:** The `post` tool is a fully defined, executable Vercel AI SDK tool that accepts a valid post payload, returns a structured `GeneratedPost`-shaped result, and enforces the 280-character body limit via zod.

**Depends on:** Phase 1 (GeneratedPost type).

**Delivers:**
- `api/tools/postTool.ts`

**Verified by:**
- Calling `execute` with a valid payload returns an object with `postId`, `body`, `threadId`, `parentId`, `imageUrl`
- Calling with `body` longer than 280 characters fails zod validation before `execute` runs
- Calling with no `threadId` causes the returned `threadId` to be a new UUID (not null, not undefined)
- The tool can be imported and attached to a `generateText` call without TypeScript errors

**Definition of done:** Tool executes correctly. Zod enforces body length. Types align with `GeneratedPost`.

---

## Phase 5: `generatePlayerImage` Tool

**Contract:** The `generatePlayerImage` tool accepts a prompt and image type, calls an image generation model, uploads the result to blob storage, and returns a valid public URL.

**Depends on:** Phase 1 (no direct type dependency, but sits alongside Phase 4).

**Delivers:**
- `api/tools/generatePlayerImageTool.ts`

**Verified by:**
- Calling `execute` with a valid prompt and type returns `{ imageUrl: string }` where the URL is a valid `https://` URL
- The `type` field controls image dimensions — `stat_card` produces a landscape image (1792×1024), others produce square (1024×1024)
- Passing an invalid `type` value fails zod validation before `execute` runs
- The returned URL is publicly accessible (HTTP GET returns 200)

**Definition of done:** Tool calls image model, uploads, returns accessible URL.

---

## Phase 6: Vercel `/api/feed` Endpoint

**Contract:** `POST /api/feed` accepts an event, context, and agent list; runs each agent as an independent `generateText` call with `post` and `generatePlayerImage` tools; enforces `maxSteps: 2`; returns all generated posts.

**Depends on:** Phase 2 (agent configs to validate against), Phase 4 (`post` tool), Phase 5 (`generatePlayerImage` tool).

**Delivers:**
- `api/feed.ts`

**Verified by:**
- Calling with 3 agents returns exactly 3 posts
- Every returned post conforms to `GeneratedPost` — no missing fields
- All 3 agents resolve faster than `3 × single-agent-latency` — confirming `Promise.all`, not sequential
- An agent cannot make more than 2 tool calls — confirmed by inspecting `steps` in the response
- Calling with `agents: []` returns `posts: []` without error
- An agent that uses `generatePlayerImage` before `post` returns a post with non-null `imageUrl`

**Definition of done:** Endpoint live. Parallel execution confirmed by timing. `maxSteps` enforced.

---

## Phase 7: `getSocialContext()` Worker View

**Contract:** A new Worker view function exists that assembles a fully typed `SocialContext` from Cache/IDB at call time. It can be called from any Worker trigger point and returns rich game context without side effects.

**Depends on:** Phase 1 (SocialContext type).

**Delivers:**
- `src/worker/views/socialContext.ts`
- `src/worker/views/index.ts` updated to export `socialContext`

**Reads from:**
- `idb.cache.teamSeasons` — team records, recent form
- `idb.cache.players` + `idb.cache.teamStats` — player season averages
- `idb.getCopies.games` — last 5 games for involved teams
- `idb.cache.events` — recent transactions

**Verified by:**
- Calling `getSocialContext("GAME_END")` returns a `SocialContext` with non-empty `teams` and `standings`
- Calling `getSocialContext("HALFTIME", { liveStats })` with a live stats object returns a context where `liveGame` is populated — without querying IDB
- Calling does not mutate any Cache record — confirmed by checking no `put()` calls exist in the file
- The return value passes TypeScript type checking as `SocialContext`

**Definition of done:** View callable from Worker. Returns typed context. No mutations.

---

## Phase 8: `emitFeedEvent()` Utility

**Contract:** A utility function exists in the Worker that packages a `FeedEvent` and pushes it to the UI via `toUI()`. It is the only place in the codebase that calls `toUI("feedEvent")`.

**Depends on:** Phase 7 (getSocialContext exists to build the context payload).

**Delivers:**
- `src/worker/util/feedEvents.ts`

```typescript
emitFeedEvent(type: FeedEventType, context: SocialContext): void
```

**Verified by:**
- Calling `emitFeedEvent` results in `toUI("feedEvent", ...)` being called exactly once with a payload that includes `type` and `context`
- The payload matches the `FeedEvent` type from Phase 1
- Searching the codebase for `toUI("feedEvent"` returns exactly one result — this file

**Definition of done:** One function. One callsite. Payload is typed.

---

## Phase 9: HALFTIME Hook

**Contract:** When the basketball game sim completes period 2, a `HALFTIME` FeedEvent fires carrying live score and first-half stat data assembled from the in-memory GameSim state — without querying IndexedDB.

**Depends on:** Phase 8 (emitFeedEvent exists).

**Delivers:**
- Additive change to `src/worker/core/GameSim.basketball/index.ts` → `simRegulation()`

**Verified by:**
- Simulating a 4-quarter game results in exactly one `HALFTIME` event emitted (not zero, not two)
- The event's `context.liveGame` is populated with the score at the end of period 2
- No IDB query is made during the HALFTIME emission — confirmed by asserting no `idb.cache.*` calls occur in the emit path
- All pre-existing `GameSim.basketball` tests continue to pass

**Definition of done:** One event fires at the right moment. No IDB access. No regressions.

---

## Phase 10: GAME_END + INJURY Hooks

**Contract:** When a game completes, a `GAME_END` FeedEvent fires with final stats. When one or more players are injured during game processing, an `INJURY` FeedEvent fires. Both events carry context assembled from Cache.

**Depends on:** Phase 8 (emitFeedEvent exists).

**Delivers:**
- Additive changes to `src/worker/core/game/play.ts` → `cbSaveResults()`

**Verified by:**
- Processing a completed game results in exactly one `GAME_END` event with `context.teams` populated
- Processing a game with an injury results in an `INJURY` event; processing one without does not
- Both events fire after stats are written — `context` reflects final numbers, not mid-game state
- All pre-existing `game/play.ts` behaviour is unchanged — return values and side effects are identical with the hook removed

**Definition of done:** Both events fire correctly. Context reflects post-game state. No regressions.

---

## Phase 11: TRADE_ALERT Hook

**Contract:** When a trade is accepted and processed, a `TRADE_ALERT` FeedEvent fires carrying both teams and all exchanged players and picks.

**Depends on:** Phase 8 (emitFeedEvent exists).

**Delivers:**
- Additive change to `src/worker/core/trade/processTrade.ts`

**Verified by:**
- Accepting a trade results in exactly one `TRADE_ALERT` event
- The event context includes the names of all players exchanged and both team names
- A rejected trade produces no `TRADE_ALERT` event
- Pre-existing trade tests pass unchanged

**Definition of done:** Event fires on accepted trades only. Context contains trade details.

---

## Phase 12: DRAFT_PICK Hook

**Contract:** When a draft pick is made, a `DRAFT_PICK` FeedEvent fires carrying the pick number, player attributes, and drafting team.

**Depends on:** Phase 8 (emitFeedEvent exists).

**Delivers:**
- Additive change to `src/worker/core/draft/selectPlayer.ts`

**Verified by:**
- Selecting a draft pick results in exactly one `DRAFT_PICK` event
- Event context contains the player's name, overall rating, position, and pick number
- Pre-existing draft tests pass unchanged

**Definition of done:** Event fires per pick. Context contains pick details.

---

## Phase 13: SEASON_AWARD + PLAYOFF_CLINCH Hooks

**Contract:** `SEASON_AWARD` fires when season awards are processed. `PLAYOFF_CLINCH` fires when a team clinches a playoff spot. Both carry context relevant to the moment.

**Depends on:** Phase 8 (emitFeedEvent exists).

**Delivers:**
- Additive change to `src/worker/core/phase/newPhaseBeforeDraft.ts` (`SEASON_AWARD`)
- Additive change to `src/worker/core/phase/newPhasePlayoffs.ts` (`PLAYOFF_CLINCH`)

**Verified by:**
- Processing the pre-draft phase results in at least one `SEASON_AWARD` event with winner name and award type
- Processing the playoff phase results in `PLAYOFF_CLINCH` events for each clinching team
- Pre-existing phase tests pass unchanged

**Definition of done:** Both events fire at correct phase transitions. No regressions.

---

## Phase 14: Feed Worker Skeleton + Agent Selection

**Contract:** A dedicated Web Worker exists that receives `FeedEvent` messages, filters the agent roster to those triggered by the event type and passing `postProbability`, and produces a resolved list of `AgentConfig`s ready to pass to Vercel. It does not yet call Vercel.

**Depends on:** Phase 2 (agent configs to filter against).

**Delivers:**
- `src/ui/workers/feedWorker.ts` (skeleton — message handling + agent selection only)

**Verified by:**
- Sending a `GAME_END` postMessage results in a filtered agent list that includes only agents with `GAME_END` in their `triggers`
- An agent with `postProbability: 0` never appears in the filtered list
- An agent with `postProbability: 1` always appears in the filtered list
- The worker receives the message without blocking the main thread — confirmed by main thread remaining responsive during processing
- No fetch call is made in this phase — network is not touched

**Definition of done:** Worker exists. Agent filtering is correct. No network calls.

---

## Phase 15: Feed Worker → Vercel Fetch

**Contract:** When the Feed Worker has a filtered agent list, it calls `POST /api/feed` and receives an array of `GeneratedPost` objects. Failed fetches are caught and logged — they do not crash the worker.

**Depends on:** Phase 14 (agent selection works), Phase 6 (endpoint exists to call).

**Delivers:**
- Updated `src/ui/workers/feedWorker.ts` — adds fetch step after agent selection

**Verified by:**
- A `GAME_END` event with 4 triggered agents results in a fetch to `/api/feed` with all 4 agents in the body
- The fetch response is parsed into an array of `GeneratedPost` objects that pass type validation
- A fetch failure (network error or non-200 response) logs an error and does not throw — the worker continues running
- No posts are written to IDB in this phase — that is Phase 16's contract

**Definition of done:** Fetch happens. Response is typed. Errors are handled gracefully.

---

## Phase 16: Feed Worker → IDB Write + UI Notify

**Contract:** After receiving posts from Vercel, the Feed Worker writes every post to `socialFeedDb` and sends a `postsReady` message back to the UI. The UI notification fires only after all writes are complete.

**Depends on:** Phase 15 (posts are fetched), Phase 3 (socialFeedDb write helpers exist).

**Delivers:**
- Updated `src/ui/workers/feedWorker.ts` — adds IDB write and postMessage notification

**Verified by:**
- After a `GAME_END` event, all returned posts appear in `socialFeedDb.getPosts()`
- The `postsReady` postMessage fires after — not before — all `addPost` calls resolve
- Posts written include all fields from `GeneratedPost` — none are dropped during the write
- The UI main thread is not involved in the IDB write — confirmed by the write path having no `postMessage` to main thread until all writes complete

**Definition of done:** Posts in IDB. Notification fires after writes. Main thread not involved in writes.

---

## Phase 17: UI Relay — `feedEventHandler.ts`

**Contract:** When `toUI("feedEvent")` fires in the UI, the payload is immediately forwarded to the Feed Worker via `postMessage`. The handler contains no business logic — it is a single-statement relay.

**Depends on:** Phase 8 (toUI("feedEvent") is emitted), Phase 16 (Feed Worker is ready to receive).

**Delivers:**
- `src/ui/util/feedEventHandler.ts`
- `src/ui/util/index.ts` updated to register `feedEvent` handler

**Verified by:**
- Every `toUI("feedEvent")` call results in exactly one `feedWorker.postMessage` call with the same payload
- `feedEventHandler.ts` contains exactly one executable statement in its handler body
- Removing `feedEventHandler.ts` entirely results in zero posts appearing in `socialFeedDb` — confirming it is the only relay
- The handler does not `await` anything — it is synchronous fire-and-forget

**Definition of done:** Relay works. One statement. Provably no logic.

---

## Phase 18: SocialFeed Panel

**Contract:** A SocialFeed UI panel exists that listens for `postsReady` messages from the Feed Worker, reads the latest posts from `socialFeedDb`, and renders each post with its handle, body, timestamp, and image (when present). The panel updates without a page reload.

**Depends on:** Phase 17 (full pipeline fires end-to-end), Phase 3 (socialFeedDb readable from UI).

**Delivers:**
- `src/ui/components/SocialFeed/index.tsx` — panel container, listens for `postsReady`
- `src/ui/components/SocialFeed/Post.tsx` — renders one post
- `src/ui/components/SocialFeed/Thread.tsx` — stub only in v1

**Verified by:**
- Simulating a game end causes new posts to appear in the panel without any user interaction
- A post with a non-null `imageUrl` renders an image element; a post with null `imageUrl` renders no image element and no broken placeholder
- The panel re-reads `socialFeedDb` on `postsReady` — it does not cache posts in React state between events
- `Thread.tsx` exists and exports a valid component but renders nothing — it is a v2 stub

**Definition of done:** Panel renders live posts. Images conditional. Thread component stubbed. Full pipeline verified end-to-end.
