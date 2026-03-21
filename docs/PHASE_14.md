# Phase 14: Feed Worker Skeleton + Agent Selection

## Contract

A dedicated Web Worker exists that receives `FeedEvent` messages, filters the agent roster to those triggered by the event type and passing `postProbability`, and produces a resolved list of `AgentConfig`s ready to pass to Vercel. It does not yet call Vercel. No network call is made anywhere in this phase.

The worker is instantiated once by the UI process and kept alive for the lifetime of the page. It is entirely separate from the existing game Shared Worker — it has no dependency on the game engine and no access to league IDB.

## Depends on

- **Phase 2** — all 7 agent config JSON files exist in `src/data/socialAgents/`. The Feed Worker imports them statically as its full agent roster.
- **Phase 3a** — `socialFeedDb` has an `accounts` object store that the Feed Worker can query. `getAllAccounts()` is used to verify which player and org accounts are currently active before including their template in the selection output.

## Delivers

- `src/ui/workers/feedWorker.ts` — dedicated Web Worker, message handling + agent selection only

No other files are created in this phase. No existing files are modified. The worker is not yet wired to any UI callsite — Phase 17 provides the relay that sends it `FeedEvent` messages.

## Worker Architecture

### How Workers work in this codebase

The existing game engine runs in either a `SharedWorker` or a plain `Worker` depending on browser support. It is instantiated in `src/ui/util/index.ts`:

```typescript
worker = window.useSharedWorker
	? new SharedWorker(workerPath, { type: "module" })
	: new Worker(workerPath, { type: "module" });
```

The worker path is resolved at runtime to a versioned bundle in `/gen/`. Communication goes through `promise-worker-bi` (`PWBHost` on the UI side, `PWBClient` inside the worker), which wraps `postMessage` / `onmessage` in a promise-based request/response protocol.

The Feed Worker uses a simpler, lower-level pattern: plain `self.onmessage` / `self.postMessage`. There is no need for the promise-worker-bi abstraction because the Feed Worker's communication is one-way in this phase — it receives events and (in later phases) fires notifications back. No request/response pairing is required.

### Feed Worker instantiation

The Feed Worker is instantiated by the UI, not by the game Worker. The recommended pattern, using Vite/webpack module worker syntax:

```typescript
// In the UI callsite (Phase 17 will add this — shown here for reference)
const feedWorker = new Worker(
	new URL("../workers/feedWorker.ts", import.meta.url),
	{ type: "module" },
);
```

The `new URL(...)` pattern is standard for ES module workers in Vite and webpack 5. It resolves the worker path at bundle time and produces a separate chunk for the worker, so it does not inflate the main bundle.

### Worker isolation

The Feed Worker has its own module scope. It cannot access:

- `window` (not defined in Worker scope)
- The game Worker's in-memory state
- The league IDB (it never opens it)

It can access:

- `socialFeedDb` — opened directly via the IDB API, same as the UI opens it. IndexedDB is shared across all contexts on the same origin.
- All statically imported agent config JSON — bundled into the worker chunk at build time.

### Lifetime

The Feed Worker is created once per page load and stays alive. It does not terminate between events. This means:

- All static agent configs are imported once at startup.
- IDB is opened once (on first access) and the connection is reused.
- There is no startup overhead on each `FeedEvent` message.

## Message Protocol

All messages follow a discriminated union shape with a `type` string field.

### Inbound messages (UI → Feed Worker)

```typescript
type FeedWorkerInboundMessage = {
	type: "feedEvent";
	payload: FeedEvent;
};
```

This is the only message type the worker handles in Phase 14. Future phases do not add new inbound message types — Phase 15 adds network calls internally, and Phase 16 adds outbound messages, but the inbound protocol is stable from Phase 14 onward.

### Outbound messages (Feed Worker → UI) — future phases

Defined here for documentation completeness. The worker does not send these in Phase 14.

```typescript
// Phase 16 adds this
type FeedWorkerOutboundMessage = {
	type: "postsReady";
	posts: GeneratedPost[];
};
```

### Message handler skeleton

```typescript
self.onmessage = (event: MessageEvent<FeedWorkerInboundMessage>) => {
	const msg = event.data;
	if (msg.type === "feedEvent") {
		enqueue(msg.payload);
	}
};
```

The handler is synchronous and delegates to `enqueue` (see Event Queue section below). `handleFeedEvent` is async; errors inside it must be caught internally so they never propagate as unhandled rejections to `self.onmessage`.

## Event Queue / Backpressure

The Feed Worker must handle events arriving faster than the Vercel fetch can complete. Without a queue, a burst of `FeedEvent` messages (e.g. multiple game results firing in rapid succession) would launch concurrent fetches that race against each other and can produce out-of-order IDB writes.

The solution is a simple FIFO queue with a single-flight drain loop: incoming events are pushed onto a queue array and processed one at a time. The next event is not dequeued until the current `handleFeedEvent` call (including its `await fetch`) has fully resolved.

```typescript
const queue: FeedEvent[] = [];
let processing = false;

async function enqueue(event: FeedEvent): Promise<void> {
	queue.push(event);
	if (!processing) {
		processNext();
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
	processNext();
}
```

**Properties of this design:**

- **Serial processing** — one Vercel fetch is in flight at a time. Events are handled in arrival order.
- **No dropped events** — every enqueued `FeedEvent` is eventually processed, even if the queue grows during a slow fetch.
- **No blocking** — `enqueue` returns immediately. `processNext` runs asynchronously; the `self.onmessage` handler is never suspended waiting for a fetch.
- **Bounded concurrency** — the `processing` flag prevents re-entrant calls to `processNext`. When `processNext` completes one event it calls itself tail-recursively for the next, which is safe because the recursive call happens after `await` — the call stack is already unwound.

The queue is module-level state. It persists for the lifetime of the worker and carries over between events. This is correct: the worker is long-lived and the queue only ever grows from `self.onmessage` callbacks, which are dispatched on the worker's single-threaded event loop.

## Agent Selection Algorithm

### Overview

Agent selection runs once per `FeedEvent`. It produces a list of `AgentConfig`s that should generate posts for this event. The list is passed to Vercel in Phase 15.

Three filters apply in sequence:

1. **Trigger filter** — the agent's `triggers` array must include the event's `type`.
2. **Probability filter** — a random roll against `postProbability` must pass.
3. **Account status filter** — for player and org agents, a live `Account` record with `status: "active"` must exist. For journalist and fan agents, their accounts are always seeded at init and are always active — no IDB check needed for them.

### Template configs vs live accounts

This distinction is critical and easy to get wrong:

The 7 JSON files in `src/data/socialAgents/` are **template configs**. The `id` field on each config is a `templateId`. For journalist and fan archetypes, `templateId === agentId` — there is a single live account per config. For player and org configs, the template represents a _class_ of accounts: Phase 3a creates one `Account` record per player (with `templateId: "player_template"`) and one per team (with `templateId: "org_template"`).

This means:

- `sham_charania.json` → one Account with `agentId: "sham_charania"` → always active → passes account check trivially.
- `players/template.json` → N Accounts with `agentId: "player_42"`, `"player_99"`, ... → each may be `"active"` or `"dormant"`.
- `orgs/template.json` → N Accounts with `agentId: "team_0"`, `"team_1"`, ... → each may be `"active"` or `"dormant"`.

**Implication for agent selection:** When the player template config passes the trigger and probability filters, we do not add one entry for `player_template` to the result. We add one entry per active player account. Similarly for the org template: one entry per active org account.

The output of `selectAgents` is therefore not a list of unique `AgentConfig` objects from the 7 templates. It is a list of resolved agent descriptors — one per account that will post. For journalist and fan configs this is a 1:1 mapping. For player and org configs this is a 1:N expansion.

To keep the `AgentConfig` shape intact in the output (so Phase 15 can pass it directly to Vercel), the player and org entries are synthesized by merging the template config with the specific account's `agentId`, `handle`, and `displayName`. The `ResolvedAgent` type is defined in Phase 1 types and imported here:

```typescript
// From src/common/types.feedEvent.ts (Phase 1)
type ResolvedAgent = AgentConfig & {
	agentId: string; // the live agentId, e.g. "player_42"
	displayName: string;
};
```

Construction at the expansion site:

```typescript
const resolved: ResolvedAgent = {
	...config,
	agentId: account.agentId,
	displayName: account.displayName,
};
```

### Account status IDB read

`getAllAccounts()` from Phase 3 is called at the start of each `handleFeedEvent` call. This is a full-store read — all accounts are fetched once per event. Filtering is done in memory.

The read is async. It opens `socialFeedDb` if not already open. Since the worker keeps a persistent IDB connection (opened on first access), subsequent reads do not reopen the database.

### Selection algorithm

```typescript
async function selectAgents(event: FeedEvent): Promise<ResolvedAgent[]> {
	const accounts = await getAllAccounts();

	const activeByTemplateId = new Map<string, Account[]>();
	for (const account of accounts) {
		if (account.status !== "active") continue;
		const list = activeByTemplateId.get(account.templateId) ?? [];
		list.push(account);
		activeByTemplateId.set(account.templateId, list);
	}

	const result: ResolvedAgent[] = [];

	for (const config of ALL_CONFIGS) {
		// Filter 1: trigger check
		if (!config.triggers.includes(event.type)) continue;

		// Filter 2: probability roll
		if (Math.random() > config.postProbability) continue;

		// Filter 3: account expansion
		if (config.type === "journalist" || config.type === "fan") {
			// One account per config, templateId === agentId
			const account = activeByTemplateId.get(config.id)?.[0];
			if (!account) continue; // account missing or dormant — skip
			result.push({
				...config,
				agentId: account.agentId,
				displayName: account.displayName,
			});
		} else {
			// player or org: expand to all active accounts for this template
			const matchingAccounts = activeByTemplateId.get(config.id) ?? [];
			for (const account of matchingAccounts) {
				result.push({
					...config,
					agentId: account.agentId,
					displayName: account.displayName,
				});
			}
		}
	}

	return result;
}
```

### Probability semantics

- `postProbability: 0` → `Math.random() > 0` is always true → agent never appears. Correct.
- `postProbability: 1` → `Math.random() > 1` is always false → agent always appears. Correct.
- `postProbability: 0.7` → agent appears approximately 70% of the time. Correct.

The probability roll happens once per config, not once per account. If the org template rolls false, no org accounts post for this event. If it rolls true, all active org accounts post. This is intentional: the probability models "is this kind of voice active for this event?" not "does each individual account flip its own coin?". Per-account probability can be revisited in v2 if needed.

### Player/org context expansion

When a player or org account passes all three filters, the worker must attach the relevant `PlayerSummary` or `TeamSummary` from the event's `SocialContext` so the prompt builder has entity-specific data to work with.

For a **player agent** (template type `"player"`), find the matching `PlayerSummary` in `event.context.players` using the account's `pid`:

```typescript
const playerSummary = event.context.players.find((p) => p.pid === account.pid);
```

For an **org agent** (template type `"org"`), find the matching `TeamSummary` in `event.context.teams` using the account's `tid`:

```typescript
const teamSummary = event.context.teams.find((t) => t.tid === account.tid);
```

These summaries are passed alongside the `ResolvedAgent` to the prompt builder (`resolveAgentPrompt`) so it can personalise the prompt with player stats, team name, record, etc. If the summary is not found (the player or team is not in the event context), the account is skipped — there is no useful context to include.

### `resolveAgentPrompt` contract

`resolveAgentPrompt` is defined in Phase 6 and imported into the Feed Worker in Phase 15. Its signature:

```typescript
function resolveAgentPrompt(agent: ResolvedAgent, event: FeedEvent): string;
```

- **Receives** a fully resolved agent (`ResolvedAgent`) and the originating `FeedEvent` (which carries `SocialContext` in `event.context`).
- **Returns** a `string` — the complete prompt body to send to the AI model for this agent/event combination.

The prompt builder accesses `event.context.players` and `event.context.teams` internally when building player- or org-specific copy. The caller (the Feed Worker) does not need to pass the `PlayerSummary` or `TeamSummary` separately — they are available via `event.context` inside `resolveAgentPrompt`.

### `ALL_CONFIGS` ordering

`ALL_CONFIGS` is declared at module scope and ordered by archetype importance (journalist first, then fans, then player template, then org template). Order within the array does not affect correctness but makes logging and debugging easier.

## Implementation

Full `src/ui/workers/feedWorker.ts` skeleton:

```typescript
// feedWorker.ts — Phase 14: message handling + agent selection only
// Phase 15 adds: Vercel fetch
// Phase 16 adds: IDB write + postsReady notification

import type {
	AgentConfig,
	FeedEvent,
	Account,
} from "../../common/types.feedEvent.ts";
import { getAllAccounts } from "../db/socialFeedDb.ts";

// ---------------------------------------------------------------------------
// Static config imports — bundled at build time, never fetched at runtime
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Resolved agent type — AgentConfig expanded with live account identity
// ---------------------------------------------------------------------------

export type ResolvedAgent = AgentConfig & {
	agentId: string;
	displayName: string;
};

// ---------------------------------------------------------------------------
// Inbound message type
// ---------------------------------------------------------------------------

type FeedWorkerInboundMessage = {
	type: "feedEvent";
	payload: FeedEvent;
};

// ---------------------------------------------------------------------------
// Agent selection
// ---------------------------------------------------------------------------

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

		// Filter 2: probability roll — skip if random exceeds threshold
		if (Math.random() > config.postProbability) continue;

		// Filter 3: expand to live accounts
		if (config.type === "journalist" || config.type === "fan") {
			// One-to-one: templateId === agentId for journalist and fan configs
			const account = activeByTemplateId.get(config.id)?.[0];
			if (account === undefined) continue;
			result.push({
				...config,
				agentId: account.agentId,
				displayName: account.displayName,
			});
		} else {
			// One-to-many: player_template and org_template expand to all active accounts
			const matchingAccounts = activeByTemplateId.get(config.id) ?? [];
			for (const account of matchingAccounts) {
				result.push({
					...config,
					agentId: account.agentId,
					displayName: account.displayName,
				});
			}
		}
	}

	return result;
}

// ---------------------------------------------------------------------------
// Event handler
// ---------------------------------------------------------------------------

async function handleFeedEvent(event: FeedEvent): Promise<void> {
	let selectedAgents: ResolvedAgent[];

	try {
		selectedAgents = await selectAgents(event);
	} catch (err) {
		console.error("[feedWorker] selectAgents failed:", err);
		return;
	}

	if (selectedAgents.length === 0) {
		console.log("[feedWorker] No agents selected for event:", event.type);
		return;
	}

	console.log(
		`[feedWorker] Selected ${selectedAgents.length} agents for ${event.type}:`,
		selectedAgents.map((a) => a.agentId),
	);

	// Phase 15 will replace this stub with: fetch POST /api/feed
	// Phase 16 will then write posts to IDB and notify the UI
}

// ---------------------------------------------------------------------------
// Event queue / backpressure
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = (event: MessageEvent<FeedWorkerInboundMessage>) => {
	const msg = event.data;
	if (msg.type === "feedEvent") {
		enqueue(msg.payload);
	}
};
```

## Static Config Loading

All 7 JSON configs are imported at the top of `feedWorker.ts` as ES module static imports. This is the same pattern used in the Phase 2 validation script and in `initializeAccounts.ts`.

**Why static imports, not fetch or dynamic import:**

- Zero latency — configs are already in the worker's module scope before the first message arrives.
- TypeScript can type-check the JSON shapes when `resolveJsonModule: true` is set in `tsconfig.json`.
- Bundlers (Vite, webpack 5) handle JSON imports natively — no runtime parsing, no network request.
- The worker chunk is self-contained — it does not depend on any network resource to start handling messages.

**Type assertion pattern:**

JSON files do not have TypeScript types inferred from the schema automatically. Asserting `as AgentConfig` at the point of inclusion in `ALL_CONFIGS` is safe because:

- The Phase 2 validation script (`scripts/validateAgentConfigs.ts`) has already verified every config at build/CI time.
- Any structural mismatch will be caught at that point, not silently at runtime.

**`resolveJsonModule` requirement:**

`tsconfig.json` must include:

```json
{
	"compilerOptions": {
		"resolveJsonModule": true
	}
}
```

If this flag is not present, the JSON imports will fail to compile. The flag is standard in most modern TypeScript projects and is likely already set in this codebase.

## Implementation Notes

### Why a dedicated Worker, not an async function in the UI?

The Feed Worker exists to keep the event-processing pipeline off the main thread. Agent selection reads from IDB (`getAllAccounts()`). In Phase 15 and 16, it will also make a network fetch and write posts back to IDB. These operations would not block the main thread if run as plain async functions (since `await` yields the event loop), but they do create contention with React rendering and UI event handling.

More importantly, the Worker boundary provides a clean architectural constraint: the pipeline's I/O (IDB read → Vercel fetch → IDB write) is fully isolated, so Phase 15 and 16 can be developed without touching any UI code.

### `getAllAccounts()` is called on every event

Rather than caching accounts in worker memory, `getAllAccounts()` is called fresh on every `FeedEvent`. This ensures dormant/active status changes (from `syncPlayerAccounts`) are always reflected without requiring the worker to be notified of account updates. IDB reads are fast (indexed scan on a small store) and the extra latency is negligible against network fetch time in Phase 15.

If profiling in Phase 15 reveals IDB read overhead is meaningful, a short-lived in-memory cache (invalidated after N seconds or on an explicit "accountsUpdated" message) can be added. Do not pre-optimize.

### Probability roll is per-config, not per-account

The `Math.random()` roll happens once per `AgentConfig` entry in `ALL_CONFIGS`, before the account expansion step. This means:

- If `org_template` rolls false, no team org accounts post for this event.
- If `org_template` rolls true, all active team org accounts post.

This is a deliberate design choice for v1: the probability models "is this voice type active for this event?" rather than "does each individual account independently decide?". With 30 teams, per-account independent rolls at `postProbability: 0.4` would still produce ~12 org posts per event — likely too many. A single per-template roll caps it at either 0 or all.

If the product requires per-account independent rolls (e.g. for the homer fan who follows a specific team), that can be added in v2 by moving the `Math.random()` roll inside the account expansion loop.

### `replyEligible` is ignored in Phase 14

All configs currently have `replyEligible: false`. The selection algorithm does not filter on this field. When `replyEligible: true` agents are introduced in v2, a filter can be added here.

### Error handling strategy

Every async operation in `handleFeedEvent` is wrapped in a try/catch. Errors are logged to `console.error` and swallowed — they must never propagate to `self.onmessage` as an unhandled rejection. An unhandled rejection in a Worker can terminate the worker in some browsers, which would silently kill the feed pipeline.

### The worker does not terminate between events

`self.onmessage` is a persistent listener. The worker stays alive until the page unloads. This means all module-level state (static configs, eventual IDB connection) persists across events.

### Worker file location

The file lives at `src/ui/workers/feedWorker.ts`. This path does not exist yet — the `workers/` directory must be created. This is the only directory created in this phase.

The path mirrors convention: `src/ui/util/` contains utilities, `src/ui/workers/` will contain dedicated Worker entry points.

## Verified by

- Constructing a mock `FeedEvent` with `type: "GAME_END"` and sending it via `postMessage` to the worker results in `selectedAgents` containing only configs whose `triggers` array includes `"GAME_END"`. Confirmed by inspecting the console log line in `handleFeedEvent`.

- An agent config with `postProbability: 0` never appears in `selectedAgents`, regardless of event type. Confirmed by running 1000 iterations and asserting `selectedAgents.filter(a => a.agentId === "agent_with_zero_prob").length === 0`.

- An agent config with `postProbability: 1` always appears in `selectedAgents` when the event type matches its triggers. Confirmed by running 1000 iterations and asserting 100% presence.

- The main thread remains responsive during worker processing. Confirmed by verifying that a `setTimeout` callback on the main thread fires while the worker is processing a `GAME_END` event (no blocking).

- No `fetch` call is made in this phase. Confirmed by:
  - Searching `feedWorker.ts` for `fetch` — zero matches.
  - Running with a network intercept that throws on any fetch — no error thrown.
  - Inspecting browser DevTools Network tab after sending a `feedEvent` message — no outgoing requests.

## Definition of Done

Worker file exists at `src/ui/workers/feedWorker.ts`. Worker compiles with zero TypeScript errors under `tsc --noEmit`. Agent filtering correctly applies trigger check, probability roll, and account status expansion. A `postProbability: 0` agent never appears in the selection output. A `postProbability: 1` agent always appears when triggered. No fetch call anywhere in the worker. No writes to any IDB store. No changes to any existing file.
