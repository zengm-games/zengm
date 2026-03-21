# Phase 6: Vercel `/api/feed` Endpoint

## Contract

`POST /api/feed` accepts an event, a social context, and an agent list. It runs each agent as an independent `generateText` call with the `post` and `generatePlayerImage` tools available. It enforces `maxSteps: 2` per agent. All agents run in parallel via `Promise.all`. The endpoint returns all successfully generated posts. If an individual agent fails, its failure is isolated — the other agents' posts are still returned.

## Depends on

- Phase 1 (`ResolvedAgent` type — `AgentConfig & { agentId: string; displayName: string }` — used by the prompt builders)
- Phase 2 (`AgentConfig` shape — the request body carries pre-filtered agent configs)
- Phase 4 (`postTool` from `api/tools/postTool.ts`)
- Phase 5 (`generatePlayerImageTool` from `api/tools/generatePlayerImageTool.ts`)

## Delivers

- `api/feed.ts`

## Request Schema

```typescript
// POST /api/feed
{
  event: {
    type: FeedEventType;   // e.g. "GAME_END"
    timestamp: number;     // Unix ms
  };
  context: SocialContext;   // assembled by getSocialContext() in the Worker (Phase 7)
  agents: ResolvedAgent[]; // pre-filtered by the Feed Worker (Phase 14); ResolvedAgent = AgentConfig & { agentId: string; displayName: string }
}
```

The caller (Feed Worker, Phase 15) is responsible for filtering agents by `triggers` and `postProbability` before the request is sent. The endpoint treats the `agents` array as authoritative — it runs every agent it receives without re-filtering.

Sending `agents: []` is valid and returns `{ posts: [] }` without invoking any model.

## Response Schema

```typescript
// 200 OK
{
  posts: GeneratedPost[];
}
```

Every entry in `posts` is a fully conformant `GeneratedPost`. Fields that the `post` tool cannot know at call time (`agentId`, `handle`, `eventType`, `createdAt`, `likes`, `reposts`) are stamped in by the route handler after the tool call completes.

If an agent fails (model error, tool not called, exception), that agent is excluded from the response. The remaining agents' posts are included. The response is always HTTP 200 as long as the request was well-formed. HTTP 500 is reserved for infrastructure failures (missing API key, catastrophic parse error).

## Implementation

Full implementation of `api/feed.ts`:

```typescript
// api/feed.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { postTool } from "./tools/postTool.ts";
import { generatePlayerImageTool } from "./tools/generatePlayerImageTool.ts";
import type {
	AgentConfig,
	FeedEventType,
	GeneratedPost,
	SocialContext,
} from "../src/common/types.feedEvent.ts";

// ─── Types ────────────────────────────────────────────────────────────────────

// ResolvedAgent is defined in Phase 1 types as:
//   AgentConfig & { agentId: string; displayName: string }
// The prompt builders use ResolvedAgent so they have access to agentId and displayName
// in addition to the full AgentConfig shape (persona, type, triggers, postProbability, etc.).

type FeedRequestBody = {
	event: {
		type: FeedEventType;
		timestamp: number;
	};
	context: SocialContext;
	agents: ResolvedAgent[];
};

// ─── Prompt builders ──────────────────────────────────────────────────────────

// buildSystemPrompt takes a ResolvedAgent (AgentConfig & { agentId: string; displayName: string }).
// It uses ResolvedAgent.persona as the character description (system prompt voice) and
// ResolvedAgent.displayName as the posting identity shown to the model.
function buildSystemPrompt(agent: ResolvedAgent): string {
	const typeLabel: Record<AgentConfig["type"], string> = {
		journalist: "an insider sports journalist",
		fan: "a passionate fan",
		player: "a professional basketball player",
		org: "the official account of a basketball team",
	};

	return [
		// Persona is the stable character description — always first so the model treats it as primary.
		agent.persona,
		"",
		// displayName tells the model what identity it is posting under.
		`You are posting as ${agent.displayName} — ${typeLabel[agent.type]} — on a Twitter-like social platform inside a basketball simulation game.`,
		"",
		"IMPORTANT: You MUST call the `post` tool to publish your content. The `post` tool is your only output mechanism — any text you generate without calling it is discarded. Do not explain what you are going to post. Just call the tool.",
		"",
		"You may optionally call `generatePlayerImage` first if the moment warrants a visual (a stat milestone, a big win, an award). If you do, pass the returned URL to the `post` tool as `imageUrl`. If you call `generatePlayerImage`, you have used your first step — call `post` next. If you do not need an image, call `post` directly.",
		"",
		"You have at most 2 steps. Use them well.",
	].join("\n");
}

function buildEventPrompt(
	event: { type: FeedEventType; timestamp: number },
	context: SocialContext,
): string {
	const lines: string[] = [];

	// Event header
	const eventLabels: Record<FeedEventType, string> = {
		GAME_END: "A game just ended.",
		HALFTIME: "It is halftime.",
		TRADE_ALERT: "A trade has just been announced.",
		DRAFT_PICK: "A draft pick was just made.",
		INJURY: "A player has been injured.",
		PLAYER_SIGNING: "A player signing has been announced.",
		SEASON_AWARD: "Season awards have just been announced.",
		PLAYOFF_CLINCH: "A team has just clinched a playoff spot.",
	};

	lines.push(`EVENT: ${eventLabels[event.type]}`);
	lines.push("");

	// Live game state (HALFTIME only)
	if (context.liveGame) {
		const { score, quarter, statLeaders } = context.liveGame;
		lines.push(`LIVE SCORE: ${score[0]} – ${score[1]} (end of Q${quarter})`);
		if (statLeaders.length > 0) {
			lines.push("STAT LEADERS:");
			// Truncate to top 5 stat leaders to keep the prompt compact.
			for (const leader of statLeaders.slice(0, 5)) {
				lines.push(`  ${leader.name}: ${leader.statLine}`);
			}
		}
		lines.push("");
	}

	// Teams involved
	if (context.teams.length > 0) {
		lines.push("TEAMS:");
		for (const team of context.teams) {
			lines.push(`  ${team.name} (${team.abbrev}) — ${team.record}`);
		}
		lines.push("");
	}

	// Players involved
	if (context.players.length > 0) {
		lines.push("PLAYERS:");
		for (const player of context.players) {
			lines.push(
				`  ${player.name} — ${player.pos}, ${player.team}, OVR ${player.ovr}${player.statLine ? `, ${player.statLine}` : ""}`,
			);
		}
		lines.push("");
	}

	// Recent games (for GAME_END context) — truncated to last 3.
	if (context.recentGames.length > 0) {
		lines.push("RECENT GAMES:");
		for (const game of context.recentGames.slice(0, 3)) {
			lines.push(
				`  ${game.homeTeam} ${game.homeScore} – ${game.awayScore} ${game.awayTeam}`,
			);
		}
		lines.push("");
	}

	// Standings snapshot — truncated to top 5.
	if (context.standings.length > 0) {
		lines.push("STANDINGS (top 5):");
		for (const entry of context.standings.slice(0, 5)) {
			lines.push(`  ${entry.rank}. ${entry.teamName} — ${entry.record}`);
		}
		lines.push("");
	}

	// Recent transactions (trades, signings)
	if (context.transactions.length > 0) {
		lines.push("RECENT TRANSACTIONS:");
		for (const tx of context.transactions) {
			lines.push(`  ${tx.description}`);
		}
		lines.push("");
	}

	lines.push(
		"React to this event in your established voice. Call `post` to publish.",
	);

	return lines.join("\n");
}

// ─── Per-agent runner ─────────────────────────────────────────────────────────

// runAgent takes a ResolvedAgent so it can use agentId and displayName alongside AgentConfig fields.
async function runAgent(
	agent: ResolvedAgent,
	event: { type: FeedEventType; timestamp: number },
	context: SocialContext,
): Promise<GeneratedPost | null> {
	try {
		const result = await generateText({
			model: google("gemini-2.0-flash"),
			system: buildSystemPrompt(agent),
			prompt: buildEventPrompt(event, context),
			tools: {
				post: postTool,
				generatePlayerImage: generatePlayerImageTool,
			},
			maxSteps: 2,
		});

		// Extract the post tool result — agents MUST call `post`
		const postResult = result.toolResults.find((r) => r.toolName === "post");
		if (!postResult) {
			console.warn(
				`[api/feed] Agent ${agent.agentId} did not call post — discarding`,
			);
			return null;
		}

		const toolOutput = postResult.result as {
			postId: string;
			body: string;
			threadId: string;
			parentId: string | null;
			imageUrl: string | null;
		};

		// Stamp caller-owned fields onto the tool result to produce a full GeneratedPost.
		// agentId comes from ResolvedAgent.agentId; handle comes from ResolvedAgent.handle.
		const generatedPost: GeneratedPost = {
			postId: toolOutput.postId,
			agentId: agent.agentId,
			handle: agent.handle,
			body: toolOutput.body,
			eventType: event.type,
			threadId: toolOutput.threadId,
			parentId: toolOutput.parentId,
			imageUrl: toolOutput.imageUrl,
			createdAt: Date.now(),
			likes: 0,
			reposts: 0,
		};

		return generatedPost;
	} catch (err) {
		console.error(`[api/feed] Agent ${agent.agentId} threw:`, err);
		return null;
	}
}

// ─── Route handler ────────────────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).end("Method Not Allowed");
		return;
	}

	if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
		res.status(500).json({
			error:
				"Server misconfiguration: GOOGLE_GENERATIVE_AI_API_KEY is not set.",
		});
		return;
	}

	const rawBody = req.body;
	const body: FeedRequestBody =
		typeof rawBody === "string"
			? (JSON.parse(rawBody) as FeedRequestBody)
			: (rawBody as FeedRequestBody);

	const { event, context, agents } = body;

	// Empty agent list is valid — return immediately
	if (!agents || agents.length === 0) {
		res.status(200).json({ posts: [] });
		return;
	}

	// Run all agents in parallel
	const results = await Promise.all(
		agents.map((agent) => runAgent(agent, event, context)),
	);

	// Filter out agents that failed or did not call post
	const posts = results.filter((p): p is GeneratedPost => p !== null);

	res.status(200).json({ posts });
}
```

## Agent Prompt Construction

### System prompt (`buildSystemPrompt`)

`buildSystemPrompt` accepts a `ResolvedAgent` (`AgentConfig & { agentId: string; displayName: string }`). It must not be called with a bare `AgentConfig` — `displayName` is required for persona injection.

The system prompt is assembled per-agent from three layers:

1. **Persona string** — `ResolvedAgent.persona`, the agent's stable character description. This is the primary voice instruction and always appears first. It is written in second person ("You are a grizzled beat reporter..."). The model treats the first content in the system prompt as the authoritative character definition.

2. **Posting identity + account type label** — `ResolvedAgent.displayName` is the name the agent posts under (e.g. "SportsBeat Daily", "Marcus_Fan_23"). It is injected alongside the account type label so the model knows both who it is and what kind of account it represents (journalist, fan, player, org).

3. **Tool contract** — an explicit instruction that `post` is the only output mechanism. This is critical: without it, agents may generate text responses instead of tool calls. The instruction also explains the optional `generatePlayerImage` flow and the 2-step budget.

The system prompt deliberately does not include event-specific content — that is the job of the event prompt. This separation means the system prompt is stable across all event types for a given agent and can be inspected or logged independently.

### Event prompt (`buildEventPrompt`)

The event prompt is shared across all agents running for the same event. It serializes the `SocialContext` as readable prose rather than raw JSON. Raw JSON degrades model output quality when the context is large — prose gives the model a scannable summary that it can reference naturally in the generated post.

The serialization is conditional on content: empty arrays are omitted entirely rather than rendered as "PLAYERS: (none)". This keeps the prompt compact for events that only touch a subset of the context.

**Context window management:** `SocialContext` can be large. The prompt builder must truncate before serializing to avoid bloating the context window and degrading model output quality. Apply these limits:

- **Stat leaders** (`context.liveGame.statLeaders`): include top 3–5 only.
- **Recent games** (`context.recentGames`): include last 3 only.
- **Standings** (`context.standings`): include top 5 entries only (the current code uses `.slice(0, 8)` — tighten this to `.slice(0, 5)`).
- **Players** and **transactions**: include at most 5 entries each if the array can grow unbounded.

These limits are not enforced by the `SocialContext` type — the prompt builder is responsible for applying them at serialization time.

**Per-event emphasis:**

| Event            | Context sections emphasized                                       |
| ---------------- | ----------------------------------------------------------------- |
| `HALFTIME`       | Live score, stat leaders (from `context.liveGame`)                |
| `GAME_END`       | Final score from teams, top performers from players, recent games |
| `TRADE_ALERT`    | Both teams, all players listed in `context.players`, transactions |
| `DRAFT_PICK`     | Player details (name, OVR, position), team, transactions          |
| `INJURY`         | Player (name, position, team), teams                              |
| `PLAYER_SIGNING` | Player, both teams (if applicable), transactions                  |
| `SEASON_AWARD`   | Players (award winners), standings context                        |
| `PLAYOFF_CLINCH` | Clinching team from teams, standings                              |

The `SocialContext` type is the same regardless of event type — what varies is which fields the caller populates. `context.liveGame` is only non-null for `HALFTIME`. The prompt builder handles this gracefully by guarding every section.

## Post Assembly

After `generateText` resolves, the route handler extracts the tool call result from `result.toolResults`:

```typescript
const postResult = result.toolResults.find((r) => r.toolName === "post");
```

`result.toolResults` is an array of all tool call results across all steps. When `maxSteps: 2`, there can be at most 2 entries. The handler looks for the one where `toolName === "post"`.

The `post` tool returns `PostToolResult` — the fields it can compute itself:

| Field      | Source                                          |
| ---------- | ----------------------------------------------- |
| `postId`   | `crypto.randomUUID()` inside `postTool.execute` |
| `body`     | Model-generated, zod-validated ≤ 280 chars      |
| `threadId` | Model-supplied or auto-generated UUID           |
| `parentId` | Model-supplied or `null`                        |
| `imageUrl` | Model-supplied (from step 1) or `null`          |

The handler then stamps in the caller-owned fields:

| Field       | Source                                                                                                                             |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `agentId`   | `agent.agentId` from the `ResolvedAgent` (not `agent.id` — `ResolvedAgent` extends `AgentConfig` with an explicit `agentId` field) |
| `handle`    | `agent.handle` from the `ResolvedAgent`                                                                                            |
| `eventType` | `event.type` from the request body                                                                                                 |
| `createdAt` | `Date.now()` at post-assembly time                                                                                                 |
| `likes`     | `0` (initialized by the endpoint, incremented by future interactions)                                                              |
| `reposts`   | `0` (same)                                                                                                                         |

The merge produces a fully conformant `GeneratedPost`. No field is undefined.

### `imageUrl` threading

When an agent calls `generatePlayerImage` in step 1, the Vercel AI SDK surfaces the tool result back to the model automatically before step 2. The model receives the `{ imageUrl: string }` return value and is expected to copy it into the `imageUrl` parameter of the `post` call.

The assembled `GeneratedPost.imageUrl` reflects whatever the `post` tool received. To verify that the image was threaded correctly:

```typescript
// In tests: an agent that called generatePlayerImage should have non-null imageUrl
const imagePost = posts.find((p) => p.imageUrl !== null);
expect(imagePost?.imageUrl).toMatch(/^https:\/\//);
```

The route handler does not inspect `result.toolResults` for the `generatePlayerImage` result — it trusts the model to pass the URL forward. This is consistent with how the Vercel AI SDK multi-step tool call flow is designed to work.

## Error Handling

### Per-agent isolation

Every `runAgent` call is wrapped in a `try/catch`. If `generateText` throws — network error, model error, content policy rejection, zod parse failure — the error is logged and `null` is returned for that agent. The `Promise.all` continues to resolve because each agent's promise cannot reject.

```typescript
const results = await Promise.all(
	agents.map((agent) => runAgent(agent, event, context)),
);
const posts = results.filter((p): p is GeneratedPost => p !== null);
```

Sending 3 agents where 1 throws returns 2 posts and HTTP 200. The caller (Feed Worker) receives whatever posts were generated successfully.

### Agent did not call `post`

If the model produces text but never calls the `post` tool, `result.toolResults` contains no `post` entry. The handler logs a warning and returns `null` for that agent. This is a model behavior issue, not a server error — it is handled the same way as a thrown exception.

### Missing API key

Checked at the top of the handler before any model calls. Returns HTTP 500 with a descriptive error. This is the only case where the endpoint returns a non-200 response for a valid request body.

### Malformed request body

If `JSON.parse` throws (malformed JSON), the error propagates and Vercel returns a generic 500. A more defensive implementation could wrap the parse in a try/catch and return 400, but this is a caller contract violation — the Feed Worker always sends valid JSON.

### `generatePlayerImage` failure

If `generatePlayerImage` throws in step 1 (e.g. content policy rejection, blob upload failure), the Vercel AI SDK surfaces the error to the model. Because `maxSteps: 2` and step 1 has been consumed, the model cannot retry. The agent run will either produce a post without an image (if the model calls `post` anyway) or produce no post at all. Both outcomes are handled by the assembly logic above.

## Implementation Notes

### Vercel routing pattern

The project uses the Pages Router Vercel API pattern, consistent with the existing `api/chat.ts`:

```typescript
// Pages Router pattern — default export is the handler function
export default async function handler(req: VercelRequest, res: VercelResponse) { ... }
```

This matches the `api/chat.ts` convention exactly. Do not use the App Router `export const POST` named-export pattern — it is not used anywhere in this codebase.

### Import path convention

The project uses `allowImportingTsExtensions: true` and `verbatimModuleSyntax: true`. All imports within the `api/` directory must use `.ts` extensions:

```typescript
import { postTool } from "./tools/postTool.ts";
import { generatePlayerImageTool } from "./tools/generatePlayerImageTool.ts";
import type { ... } from "../src/common/types.feedEvent.ts";
```

### `Promise.all` is required, not `for...of`

Using `for...of` with `await` would run agents sequentially, making the total latency `N × single-agent-latency`. The "Verified by" criteria explicitly require that 3 agents resolve faster than `3 × single-agent-latency`. `Promise.all` is the only way to satisfy this.

### `maxSteps: 2` enforcement

The Vercel AI SDK `generateText` function with `maxSteps: 2` will make at most 2 agentic steps (tool calls + model continuations). After 2 steps, the model is forced to stop regardless of whether it has called `post`. The per-agent result extraction handles the case where `post` was never called by returning `null` for that agent.

Inspecting `result.steps` (an array) allows verification that no agent exceeded 2 steps:

```typescript
// In tests
expect(result.steps.length).toBeLessThanOrEqual(2);
```

### Model selection

The model is `google("gemini-2.0-flash")`, consistent with the spec. This matches the model referenced in Phase 4's integration example and is appropriate for the latency and cost profile of a feed event that fires multiple agents in parallel.

The `api/chat.ts` file uses `"gemini-3-flash-preview"` — do not copy that model ID here. The feed endpoint uses `"gemini-2.0-flash"` as specified.

### Body parsing

Vercel parses JSON request bodies automatically when `Content-Type: application/json` is set. However, `req.body` may arrive as a parsed object or as a raw string depending on Vercel runtime version and configuration. The handler defensively checks `typeof rawBody === "string"` and parses if needed, matching the same pattern used in `api/chat.ts`.

### `GOOGLE_GENERATIVE_AI_API_KEY` environment variable

The `@ai-sdk/google` provider reads this variable automatically. The handler checks for its presence and returns HTTP 500 if absent, preventing confusing model errors from propagating to the caller.

### No database writes

The endpoint does not write to `socialFeedDb` or any other database. It is a pure generation layer. The Feed Worker (Phase 16) is responsible for writing the returned posts to IDB. This keeps the endpoint stateless and idempotent — the same request body always produces the same shape of output (modulo model nondeterminism).

### File location

`api/feed.ts` lives at the root of the `api/` directory alongside `api/chat.ts`. It is the second Vercel serverless function endpoint in the project. Vercel treats every `.ts` file in `api/` that exports a default function as a serverless endpoint.

## Verified by

- Calling with 3 agents returns exactly 3 posts (assuming all agents call `post`)
- Every returned post conforms to `GeneratedPost` — no missing fields, no `undefined` values
- All 3 agents resolve faster than `3 × single-agent-latency` — confirming `Promise.all`, not sequential; measure wall time of the full handler vs. a sequential implementation
- An agent cannot make more than 2 tool calls — confirmed by inspecting `result.steps.length <= 2` for each agent
- Calling with `agents: []` returns `{ posts: [] }` with HTTP 200 without invoking any model
- An agent that uses `generatePlayerImage` before `post` returns a post with a non-null `imageUrl` that begins with `https://`
- If one agent's `generateText` call throws, the remaining agents' posts are still returned — one failure does not block others
- `tsc --noEmit` on `api/feed.ts` passes with zero errors and zero `any`

## Definition of Done

Endpoint live at `POST /api/feed`. Parallel execution confirmed by timing. `maxSteps: 2` enforced per agent. Every returned post is a fully conformant `GeneratedPost`. Failed agents are isolated and excluded from the response without affecting other agents. Empty agent list returns empty posts array without error. File compiles clean.
