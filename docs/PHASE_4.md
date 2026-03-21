# Phase 4: `post` Tool

## Contract

A fully defined, executable Vercel AI SDK `tool()` exists that:

- Accepts a valid post payload from the AI model (body, threadId, parentId, imageUrl)
- Enforces a 280-character body limit via zod — rejection happens before `execute` runs
- Returns a structured result with `postId`, `body`, `threadId`, `parentId`, and `imageUrl`
- Auto-generates a `threadId` UUID when the caller does not supply one, so every post belongs to a thread
- Can be imported and attached to a `generateText` call without TypeScript errors

The tool is the output mechanism for all feed agents. Agents MUST call `post` to publish their post — there is no other output path.

## Depends on

- Phase 1 (`src/common/types.feedEvent.ts`) — specifically the `GeneratedPost` type, which the tool's return shape must align with

## Delivers

- `api/tools/postTool.ts`

## Tool Definition

```typescript
// api/tools/postTool.ts
import { tool } from "ai";
import { z } from "zod";

export type PostToolResult = {
	postId: string;
	body: string;
	threadId: string;
	parentId: string | null;
	imageUrl: string | null;
};

export const postTool = tool({
	description:
		"Publish a post to the social feed. Call this as your final step to submit your content. " +
		"Supply the text body (max 280 characters), and optionally a threadId, parentId, and imageUrl. " +
		"If you generated an image in a previous step, pass its URL as imageUrl.",
	parameters: z.object({
		body: z
			.string()
			.max(280)
			.describe(
				"The text content of the post. Must be 280 characters or fewer. " +
					"Write naturally — no hashtags, no emojis required. " +
					"React to the event with the voice defined in your persona.",
			),
		threadId: z
			.string()
			.nullable()
			.optional()
			.describe(
				"ID of the thread this post belongs to. Pass null or omit if starting a new thread. " +
					"A new UUID will be assigned automatically when omitted.",
			),
		parentId: z
			.string()
			.nullable()
			.optional()
			.describe(
				"ID of the post being replied to. Pass null or omit for a top-level post. " +
					"Reserved for v2 threading — pass null in v1.",
			),
		imageUrl: z
			.string()
			.url()
			.nullable()
			.optional()
			.describe(
				"URL of an image to attach to this post. " +
					"If you called generatePlayerImage in a previous step, pass the returned URL here. " +
					"Pass null or omit to post without an image.",
			),
	}),
	execute: async ({
		body,
		threadId,
		parentId,
		imageUrl,
	}): Promise<PostToolResult> => {
		return {
			postId: crypto.randomUUID(),
			body,
			threadId: threadId ?? crypto.randomUUID(),
			parentId: parentId ?? null,
			imageUrl: imageUrl ?? null,
		};
	},
});
```

### Why the return type is not `GeneratedPost`

`GeneratedPost` (from Phase 1) contains fields that the tool cannot know at call time:

| Field       | Stamped by                                              |
| ----------- | ------------------------------------------------------- |
| `agentId`   | Caller (the route handler knows which agent is running) |
| `handle`    | Caller (from the agent's `Account` record)              |
| `eventType` | Caller (from the `FeedEvent` that triggered this run)   |
| `createdAt` | Caller (`Date.now()` at save time)                      |
| `likes`     | Caller (initialized to `0`)                             |
| `reposts`   | Caller (initialized to `0`)                             |

The tool returns only the fields it can compute itself: `postId`, `body`, `threadId`, `parentId`, `imageUrl`. The route handler merges these with the caller-stamped fields to build the final `GeneratedPost`.

## Integration Example

The following shows a complete agent invocation. The agent may optionally call `generatePlayerImage` in step 1; it must call `post` in its final step.

**`postProbability` gating:** `postProbability` lives on `AgentConfig` (the agent template), not on `FeedEvent`. Before invoking `runFeedAgent`, the caller should gate execution with `Math.random() < agentConfig.postProbability`. Do not look for `postProbability` on the event payload — it is not there. The event carries only `type` and `timestamp`. The caller (Feed Worker, Phase 14) reads `postProbability` from the agent's config and decides whether to include that agent in the run.

```typescript
// api/agent/runFeedAgent.ts  (illustrative — not yet implemented)
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { postTool } from "../tools/postTool.ts";
import { generatePlayerImageTool } from "../tools/generatePlayerImageTool.ts";
import type {
	AgentConfig,
	FeedEvent,
	GeneratedPost,
} from "../../src/common/types.feedEvent.ts";

export async function runFeedAgent(
	agent: AgentConfig,
	account: { agentId: string; handle: string },
	event: FeedEvent,
	eventPrompt: string,
): Promise<GeneratedPost | null> {
	const result = await generateText({
		model: google("gemini-2.0-flash"),
		system: agent.persona,
		prompt: eventPrompt,
		tools: {
			post: postTool,
			generatePlayerImage: generatePlayerImageTool,
		},
		maxSteps: 2,
	});

	// Find the post tool call result
	const postResult = result.toolResults.find((r) => r.toolName === "post");
	if (!postResult) {
		// Agent did not call post — discard this run
		return null;
	}

	const toolOutput = postResult.result;

	// Merge tool output with caller-stamped fields to produce a full GeneratedPost
	const generatedPost: GeneratedPost = {
		postId: toolOutput.postId,
		agentId: account.agentId,
		handle: account.handle,
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
}
```

### Two-step flow

When `maxSteps: 2` is set:

1. **Step 1 (optional):** The model calls `generatePlayerImage`. The tool executes and returns an `imageUrl`. The model sees this result in its context.
2. **Step 2 (required):** The model calls `post`, passing the `imageUrl` from step 1 (if it generated one). The tool executes and returns the `PostToolResult`.

If the model skips step 1 and goes straight to `post`, that is valid — `imageUrl` will be `null`.

**`maxSteps` semantics:** `maxSteps: 2` means the SDK will allow at most 2 agentic steps — 1 step for optional tool use (e.g. `generatePlayerImage`) and 1 step for the final `post` call. If image generation is not needed and only text post generation is required, `maxSteps: 1` is sufficient. The value `2` is chosen here to support the optional image generation step; it is the ceiling, not the expected count. An agent that calls `post` directly uses only 1 step.

## Implementation Notes

### `crypto.randomUUID()`

Used without any import. `crypto.randomUUID()` is available natively in:

- Modern browsers (Chrome 92+, Firefox 95+, Safari 15.4+)
- Node.js 14.17+ (global `crypto` object)
- Vercel Edge Runtime

No `uuid` package import is needed. The tsconfig targets `esnext`, so this is safe.

### `threadId` auto-generation

The zod schema marks `threadId` as `.nullable().optional()`. Inside `execute`, the expression `threadId ?? crypto.randomUUID()` covers all three cases:

| Caller passes   | `threadId` in execute | Stored as |
| --------------- | --------------------- | --------- |
| A UUID string   | That UUID             | That UUID |
| `null`          | `null`                | New UUID  |
| Omits the field | `undefined`           | New UUID  |

This ensures every `GeneratedPost` has a non-null `threadId` in v1, even though `GeneratedPost.threadId` is typed as `string | null`. The tool always returns `string` from this field, so the caller can widen it to `string | null` when constructing the `GeneratedPost`.

**v1 threading note:** In v1, `threadId` and `parentId` are always `null` in the assembled `GeneratedPost` — threading is not implemented. The fields are typed and the tool accepts them, but the model is instructed to pass `null` for `parentId` (see the `.describe()` on that field), and the auto-generated `threadId` is stored but not used for any thread-grouping logic. These fields are reserved for v2.

### Zod enforces the 280-character limit before `execute`

When the AI model generates a `body` longer than 280 characters, zod rejects the tool call parameters. The `execute` function is never called. The Vercel AI SDK surfaces this as a tool call error, which the model can observe and retry with a shorter body (within its `maxSteps` budget).

### `.describe()` on every parameter

Every zod field has a `.describe()` call. The Vercel AI SDK serializes these descriptions into the tool's JSON Schema (the `description` field on each property). The model uses these descriptions to understand what each argument should contain. Omitting them degrades tool call quality.

### `imageUrl` zod validation

The parameter is typed as `.string().url().nullable().optional()`. If the model passes a malformed URL string, zod rejects it before `execute` runs. If the model passes `null` or omits the field, `execute` receives `null` or `undefined` and the `?? null` fallback handles it.

### File location

The tool lives at `api/tools/postTool.ts`, consistent with the Vercel serverless function directory. The `api/tools/` subdirectory is for shared tool modules — not routes. Vercel does not treat non-root files in `api/` as serverless function endpoints unless they are the entry file.

### Import path convention

The project uses `allowImportingTsExtensions: true` and `verbatimModuleSyntax: true` (see `tsconfig.json`). Import paths within the `api/` tree must use `.ts` extensions:

```typescript
import { postTool } from "../tools/postTool.ts";
```

## Verified by

- Calling `execute` directly with `{ body: "Hello world", threadId: null, parentId: null, imageUrl: null }` returns an object with a valid `postId` UUID, `body` equal to the input, a non-null `threadId` UUID, `parentId: null`, and `imageUrl: null`
- Calling `execute` directly with `{ body: "Hello world" }` (no `threadId`) returns a non-null, non-undefined `threadId` that is a valid UUID
- Constructing a zod parse call with `body` of 281 characters returns a zod error — `execute` is never reached
- `postTool` can be passed as `tools: { post: postTool }` to a `generateText` call without TypeScript errors
- `tsc --noEmit` on `api/tools/postTool.ts` passes with zero errors
- The return type of `execute` structurally covers the `postId`, `body`, `threadId`, `parentId`, and `imageUrl` fields of `GeneratedPost`

## Definition of Done

One file. Imports only `tool` from `"ai"` and `z` from `"zod"`. `execute` returns `PostToolResult`. Zod enforces `body` max 280. `threadId` is always a string in the return value. Compiles clean. Attachable to `generateText` without type errors.
