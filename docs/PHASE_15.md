# Phase 15: Feed Worker → Vercel Fetch

## Contract

When the Feed Worker has a filtered agent list, it calls `POST /api/feed` with the originating `FeedEvent` and the selected `AgentConfig` array. The endpoint returns `{ posts: GeneratedPost[] }`. The worker parses this response and holds the posts in memory. Failed fetches — network errors, non-200 responses, or JSON parse failures — are caught, logged, and swallowed. They do not crash the worker or affect any subsequent message handling. No posts are written to `socialFeedDb` in this phase.

## Depends on

- **Phase 14** — `src/ui/workers/feedWorker.ts` exists; agent selection produces a filtered `AgentConfig[]` ready to send
- **Phase 6** — `POST /api/feed` exists, accepts `{ event, context, agents }`, and returns `{ posts: GeneratedPost[] }`

## Delivers

- Updated `src/ui/workers/feedWorker.ts` — adds the fetch step immediately after the agent selection block from Phase 14

No new files. No changes to any other file.

## Request Construction

The Phase 6 endpoint accepts:

```typescript
// POST /api/feed — request body
{
  event: {
    type: FeedEventType;
    timestamp: number;
  };
  context: SocialContext;
  agents: AgentConfig[];
}
```

The `FeedEvent` type (from `src/common/types.feedEvent.ts`) already carries both `event.type` and `event.context`. The request body is assembled by destructuring the incoming message:

```typescript
const body = {
	event: {
		type: event.type,
		timestamp: event.timestamp,
	},
	context: event.context,
	agents: selectedAgents, // filtered AgentConfig[] from Phase 14
};
```

`event.context` is the `SocialContext` assembled by `getSocialContext()` in the Game Worker before the event was emitted. It is forwarded verbatim — the Feed Worker does not modify or re-assemble context. This is correct: the context was assembled at event-fire time in the Game Worker and is part of the `FeedEvent` payload.

The request is sent with `Content-Type: application/json` so the Vercel endpoint parses the body automatically:

```typescript
const res = await fetch(apiUrl, {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(body),
});
```

## Vercel URL Configuration

The worker needs to know where to send the request. The URL must be configurable to support local development (proxied `/api/feed`) and production (absolute Vercel URL).

**Mechanism:** `FEED_API_URL` — a plain Node/worker environment variable.

This project uses **Rolldown** (not Vite) as its bundler. Rolldown replaces `process.env.*` references at build time in worker bundles. Do **not** use `import.meta.env.VITE_*` — Rolldown does not process `import.meta.env` and there is no VITE\_ prefix convention in this codebase.

```typescript
// At the top of feedWorker.ts — evaluated once when the worker module loads
const API_URL: string =
	(process.env.FEED_API_URL as string | undefined) ?? "/api/feed";
```

**Behavior by environment:**

| Environment                | `FEED_API_URL` set? | Resolved URL                                                       |
| -------------------------- | ------------------- | ------------------------------------------------------------------ |
| Local dev                  | No                  | `/api/feed` — proxied to the local Vercel dev server               |
| Local dev (explicit)       | Yes                 | Whatever is in `.env.local`, e.g. `http://localhost:3000/api/feed` |
| Production (Vercel deploy) | Yes                 | Absolute Vercel URL, e.g. `https://agentgm.vercel.app/api/feed`    |

**Why not hardcode `/api/feed`?**

`/api/feed` works in local development when both the dev server and the Vercel dev server are running. In production, the game runs client-side from the browser — a relative URL would resolve against `https://zengm.com`, not against the Vercel deployment. The absolute URL must be injected at build time via the env var.

**Security note:** `FEED_API_URL` is a non-secret URL. It is safe to embed in the client bundle. API keys (`GOOGLE_GENERATIVE_AI_API_KEY`, `BLOB_READ_WRITE_TOKEN`) never leave Vercel's server environment and are not referenced here.

## `postId` Determinism

Each generated post must carry a `postId` that is deterministic — constructing it from the same inputs always produces the same ID. This prevents duplicate posts if the worker retries or re-processes the same event.

The `postId` is constructed from three fields that together uniquely identify a post:

```typescript
const postId = `${agent.agentId}-${event.timestamp}-${event.type}`;
```

- `agent.agentId` — the specific account that generated the post (e.g. `"player_42"`, `"sham_charania"`).
- `event.timestamp` — the millisecond timestamp of the originating event. Two different events of the same type always have different timestamps.
- `event.type` — the event type (e.g. `"GAME_END"`, `"TRADE_ALERT"`). Included for human readability and to avoid collisions if `timestamp` resolution is coarse.

This is assigned on the worker side before the request is sent to Vercel, or as a post-processing step on the response. Because `addPost` uses IDB `put` (an upsert), replaying the same `postId` is safe — the duplicate is overwritten with identical content rather than producing an error or a second record.

**Alternative:** If a hash is preferred over a string concatenation (e.g. to produce a fixed-length UUID-shaped ID), apply a lightweight hash function such as FNV-1a over the concatenated string. The concatenation form is sufficient for v1.

## Error Handling

All fetch logic is wrapped in a single `try/catch`. There are two distinct failure modes:

**Network error** — `fetch()` rejects (DNS failure, timeout, CORS block, worker offline). The `catch` block handles this.

**Non-200 response** — `fetch()` resolves but `res.ok` is `false` (HTTP 4xx or 5xx from Vercel). The `if (!res.ok)` guard handles this before any attempt to parse the body.

```typescript
try {
	const res = await fetch(apiUrl, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(body),
	});

	if (!res.ok) {
		console.error("[feedWorker] Feed API error:", res.status, res.statusText);
		return;
	}

	const { posts } = (await res.json()) as { posts: GeneratedPost[] };

	// Phase 16: write posts to socialFeedDb and notify UI
	// TODO: addPost(post) for each post, then postMessage({ type: "postsReady", posts })
} catch (err) {
	console.error("[feedWorker] Fetch failed:", err);
}
```

**Invariants:**

- The worker never re-throws from the fetch block. The `catch` swallows all errors after logging.
- `return` on non-200 exits the current message handler early. The worker continues listening for future messages — it does not terminate.
- A network error on one `GAME_END` event does not affect processing of the next `TRADE_ALERT` event.

**Logging convention:** Errors use `console.error` with a `[feedWorker]` prefix for easy filtering in the browser console. There is no retry logic in v1.

## Response Parsing

The endpoint always returns HTTP 200 with `{ posts: GeneratedPost[] }` when the request is well-formed. Individual agent failures are isolated inside the endpoint and excluded from the array — they do not surface as HTTP errors.

Parsing:

```typescript
const { posts } = (await res.json()) as { posts: GeneratedPost[] };
```

**Type assertion, not runtime validation.** The response is cast to `{ posts: GeneratedPost[] }` via a TypeScript `as` assertion. There is no Zod schema validation in v1. The rationale:

- The endpoint is trusted infrastructure under our control — it always returns conformant `GeneratedPost` objects or omits the failing agent's post entirely.
- Adding Zod to the worker adds bundle weight and complexity with minimal benefit at this stage.
- If the schema drifts between the client and server, TypeScript will surface the mismatch at compile time via the shared `GeneratedPost` type in `src/common/types.feedEvent.ts`.

**v2 note:** Add runtime Zod validation if the endpoint is ever called by third-party clients or if post-schema mismatches appear in production logs.

**Empty posts array:** If no agents were triggered, the worker skips the fetch entirely (the filtered agent list is empty, so there is nothing to send — see Phase 14). If agents are sent but all fail inside the endpoint, the response is `{ posts: [] }` and the worker receives an empty array. This is not an error — it is logged at debug level, not error level.

## Updated feedWorker.ts

Phase 14 delivers a `feedWorker.ts` that:

1. Registers a `message` event listener
2. Receives a `FeedEvent` payload
3. Loads all `AgentConfig`s
4. Filters to agents whose `triggers` includes `event.type` and who pass `Math.random() < agent.postProbability`
5. Stops there — no fetch

Phase 15 adds the fetch block immediately after step 4. The additive change is the `API_URL` constant at the top of the module and the `try/catch` fetch block at the end of the message handler:

```typescript
// src/ui/workers/feedWorker.ts
// Phase 14: message handling + agent selection (unchanged)
// Phase 15: adds API_URL constant and fetch block below

import type {
	AgentConfig,
	FeedEvent,
	GeneratedPost,
} from "../../common/types.feedEvent.ts";

// --- Phase 15 addition ---
const API_URL: string =
	(process.env.FEED_API_URL as string | undefined) ?? "/api/feed";
// --- end Phase 15 addition ---

self.addEventListener("message", async (e: MessageEvent<FeedEvent>) => {
	const event = e.data;

	// Phase 14: agent selection (existing, unchanged)
	const allAgents: AgentConfig[] = await loadAgentConfigs(); // Phase 14 helper
	const selectedAgents = allAgents.filter(
		(agent) =>
			agent.triggers.includes(event.type) &&
			Math.random() < agent.postProbability,
	);

	if (selectedAgents.length === 0) {
		return; // Nothing to do — no agents triggered
	}

	// --- Phase 15 addition: fetch /api/feed ---
	const body = {
		event: {
			type: event.type,
			timestamp: event.timestamp,
		},
		context: event.context,
		agents: selectedAgents,
	};

	try {
		const res = await fetch(API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(body),
		});

		if (!res.ok) {
			console.error("[feedWorker] Feed API error:", res.status, res.statusText);
			return;
		}

		const { posts } = (await res.json()) as { posts: GeneratedPost[] };

		// Phase 16: write posts to socialFeedDb and notify UI
		// TODO: for (const post of posts) { await addPost(post); }
		// TODO: self.postMessage({ type: "postsReady", posts });
	} catch (err) {
		console.error("[feedWorker] Fetch failed:", err);
	}
	// --- end Phase 15 addition ---
});
```

The two Phase 16 `TODO` comments mark exactly where Phase 16 will insert its IDB write and `postMessage` notification. They serve as the explicit handoff point.

## Implementation Notes

**`fetch` in Web Workers.** Standard `fetch` is available in Web Workers globally, without any polyfill or special setup. The worker runs in a browser context — `self` has the same `fetch` implementation as `window`. No import and no additional configuration is needed.

**`process.env` in workers (Rolldown).** This project uses Rolldown (not Vite) as its bundler. Rolldown replaces `process.env.*` references with their literal string values at build time, including in worker bundles. Do not use `import.meta.env.VITE_*` — that is a Vite-specific mechanism and is not processed by Rolldown. The variable name is `FEED_API_URL` (no `VITE_` prefix). TypeScript does not automatically know the type of `process.env.FEED_API_URL`, so the explicit `as string | undefined` cast is required before the `?? "/api/feed"` fallback.

**Event queue and concurrency.** The Feed Worker processes events serially via the queue introduced in Phase 14. Each `FeedEvent` message is enqueued and processed one at a time — only one `fetch` is in flight at a time. A slow fetch for a `GAME_END` event holds the queue; subsequent messages are buffered and processed in order once the current event completes. This prevents out-of-order IDB writes and racing fetches.

**No `Context-Length` or `Authorization` headers.** The endpoint is public-facing (authenticated by Vercel project association, not by a client token). The client does not have any bearer token to send — all secrets live in Vercel's environment. The only required header is `Content-Type: application/json`.

**No retry logic.** Feed events are best-effort. A failed fetch for a `GAME_END` event is logged and discarded. There is no retry timer and no exponential backoff in v1. (The internal FIFO queue in Phase 14 is for backpressure, not retries — a failed event is dropped and the queue drains to the next event.) Adding retries in v2 would require careful thought about idempotency (the endpoint is not idempotent — it calls the model every time); the deterministic `postId` scheme in Phase 15 mitigates duplicate-post risk if retries are ever added.

**Response body is not read on error.** When `res.ok` is `false`, the handler returns immediately without calling `res.json()`. This avoids consuming the response body unnecessarily and prevents a potential JSON parse error from masking the actual HTTP error code.

**`GeneratedPost` import.** Phase 15 introduces the first import of `GeneratedPost` into `feedWorker.ts`. The type import is `import type { ..., GeneratedPost }` — it is erased at build time and adds zero bytes to the worker bundle.

## Verified by

- A `GAME_END` event with 4 triggered agents results in exactly one `fetch` call to the configured `API_URL`, with a request body containing all 4 agents in the `agents` array — confirmed by mocking `fetch` and asserting on the call arguments
- The request body's `event` field contains `{ type: "GAME_END", timestamp: <number> }` — `context` is included at top level, not nested inside `event`
- The fetch response `{ posts: [...] }` is destructured and `posts` is an array of objects conforming to `GeneratedPost` — confirmed by asserting field presence on each post
- A fetch that rejects (network error) logs `"[feedWorker] Fetch failed:"` to `console.error` and does not throw — the worker message handler resolves cleanly
- A fetch that resolves with HTTP 500 logs `"[feedWorker] Feed API error: 500"` to `console.error` and returns without calling `res.json()`
- After the error cases above, the worker handles a subsequent `postMessage` correctly — it has not crashed or entered a broken state
- No calls to `addPost` or `self.postMessage` with `type: "postsReady"` are made in this phase — confirmed by asserting these are never invoked
- `tsc --noEmit` on `feedWorker.ts` passes with zero errors — `GeneratedPost`, `FeedEvent`, and `AgentConfig` imports all resolve correctly

## Definition of Done

Fetch happens after agent selection. Request body includes `event` (type + timestamp), `context`, and all selected `agents`. Response is typed as `{ posts: GeneratedPost[] }`. Non-200 responses are logged and handled without throwing. Network errors are caught and logged without crashing the worker. No posts are written to IDB — that is Phase 16. Compiles clean with zero TypeScript errors.
