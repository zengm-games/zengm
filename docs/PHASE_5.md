# Phase 5: `generatePlayerImage` Tool

## Contract

The `generatePlayerImage` tool accepts a prompt and image type, calls an image generation model, uploads the result to Vercel Blob storage, and returns a valid public URL. The tool is optional — agents call it in step 1 before calling `post` in step 2. If image generation fails, the tool throws and the agent proceeds to call `post` without an image.

## Depends on

- Phase 1 (`src/common/types.feedEvent.ts`) — no direct type import, but sits alongside Phase 4 in the same `api/tools/` directory and feeds into Phase 6

## Delivers

- `api/tools/generatePlayerImageTool.ts`

## Tool Definition

Full implementation using the Vercel AI SDK `tool()`, `experimental_generateImage`, and `@vercel/blob`:

```typescript
import { tool } from "ai";
import { experimental_generateImage } from "ai";
import { put } from "@vercel/blob";
import { z } from "zod";

const IMAGE_TYPES = ["stat_card", "player_portrait", "celebration"] as const;
type ImageType = (typeof IMAGE_TYPES)[number];

export const generatePlayerImageTool = tool({
	description:
		"Use this to generate a player stat card or celebratory image when the post would benefit from a visual. " +
		"Do not use for routine commentary. Only use when the moment — a big win, a stat milestone, an award — " +
		"warrants a visual to accompany the post.",
	parameters: z.object({
		prompt: z
			.string()
			.describe(
				"Detailed image generation prompt describing the player, scene, style, and any stat overlays to include.",
			),
		type: z
			.enum(IMAGE_TYPES)
			.describe(
				"Type of image to generate. Controls aspect ratio: " +
					"'stat_card' produces a landscape 1792×1024 image suitable for stat displays; " +
					"'player_portrait' and 'celebration' produce square 1024×1024 images.",
			),
	}),
	execute: async ({ prompt, type }: { prompt: string; type: ImageType }) => {
		const size = type === "stat_card" ? "1792x1024" : "1024x1024";

		const { image } = await experimental_generateImage({
			model: openai.image("dall-e-3"),
			prompt,
			size,
		});

		const imageBuffer = Buffer.from(image.base64, "base64");

		const blob = await put(`feed/${Date.now()}-${type}.png`, imageBuffer, {
			access: "public",
			contentType: "image/png",
		});

		return { imageUrl: blob.url };
	},
});
```

The `openai.image("dall-e-3")` call requires the `@ai-sdk/openai` provider. Add the import:

```typescript
import { openai } from "@ai-sdk/openai";
```

`@ai-sdk/openai` is the standard Vercel AI SDK provider package for OpenAI models, used the same way `@ai-sdk/google` is used in `api/chat.ts`.

## Image Types

| Type              | Dimensions  | Aspect Ratio   | Use Case                                                  |
| ----------------- | ----------- | -------------- | --------------------------------------------------------- |
| `stat_card`       | 1792 × 1024 | 16:9 landscape | Stat line displays, box scores, season averages summaries |
| `player_portrait` | 1024 × 1024 | 1:1 square     | Profile-style player image, headshot-adjacent visuals     |
| `celebration`     | 1024 × 1024 | 1:1 square     | Win moments, award announcements, playoff clinches        |

The `type` field is enforced by `z.enum(IMAGE_TYPES)` — any value outside the three defined literals fails zod validation before `execute` runs. The dimension selection happens inside `execute` via a single conditional:

```typescript
const size = type === "stat_card" ? "1792x1024" : "1024x1024";
```

Only `stat_card` is landscape; `player_portrait` and `celebration` share the square size.

## Integration with `post` Tool

The agent runs inside a `generateText` call with `maxSteps: 2`. In step 1, the agent may optionally call `generatePlayerImage`. The tool's return value `{ imageUrl: string }` is available to the agent in the next step. In step 2, the agent calls `post` and passes the URL in the `imageUrl` field.

Illustrative agent tool call sequence:

```
Step 1 → generatePlayerImage({ prompt: "...", type: "stat_card" })
         ← { imageUrl: "https://public.blob.vercel-storage.com/feed/1700000000000-stat_card.png" }

Step 2 → post({
           body: "Marcus Johnson drops 42 tonight. Stat card below.",
           imageUrl: "https://public.blob.vercel-storage.com/feed/1700000000000-stat_card.png",
         })
         ← { postId: "...", body: "...", imageUrl: "https://...", ... }
```

The agent receives the `imageUrl` string from step 1's tool result and copies it into the `imageUrl` parameter of the `post` call in step 2. The `post` tool stores it in the returned `GeneratedPost`. No additional wiring is required — the Vercel AI SDK surfaces tool results to the model between steps automatically.

The `generatePlayerImage` tool is completely optional. An agent that calls `post` directly in step 1 (skipping image generation) produces a post with `imageUrl: null`. `maxSteps: 2` is the ceiling — agents that call `generatePlayerImage` first consume both steps; agents that skip it use only one.

## Environment Variables Required

| Variable                | Purpose                                                                                                                     |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `BLOB_READ_WRITE_TOKEN` | Authorizes `@vercel/blob` `put()` calls. Set in Vercel project settings under Storage → Blob.                               |
| `OPENAI_API_KEY`        | Authorizes calls to the OpenAI image generation API (DALL-E 3). Set in Vercel project settings under Environment Variables. |

Both variables must be set in the Vercel environment for the tool to function. They are never exposed to the client — this tool runs only in the `api/` Vercel serverless function context.

## Implementation Notes

### Cost and latency

Image generation with DALL-E 3 costs approximately $0.04 per image and takes 2–4 seconds. This is meaningfully more expensive and slower than text generation. Not every agent will call this tool — only agents whose persona warrants visual content (e.g. a stat-obsessed fan generating a stat card after a big game). The AI model decides whether to invoke the tool based on its description field.

The description text is the primary signal: it tells the model to use this tool only "when the moment warrants a visual" and explicitly says "do not use for routine commentary." This reduces unnecessary image generation calls without hardcoding persona-specific logic into the tool itself.

### Error handling

If `experimental_generateImage` throws (e.g. content policy rejection, API error, timeout), the `execute` function re-throws. If `put` throws (e.g. blob upload failure, missing token), it also re-throws. In both cases, the Vercel AI SDK surfaces the error to the agent. Because `maxSteps: 2` and the agent has already consumed step 1, the agent cannot retry — it will not call `post` in a subsequent step. The calling code in `api/feed.ts` (Phase 6) should handle this case by falling back to the text-only post that the agent would have produced if it had called `post` directly.

Practically: the simplest recovery is to catch the `generateText` error in `api/feed.ts` and retry the agent call with only the `post` tool available, or to accept that the post is simply not generated for this agent in this event cycle.

### Blob path format

Uploaded images are stored at `feed/{timestamp}-{type}.png`. The timestamp is `Date.now()` (milliseconds since epoch), making the path effectively unique without requiring a UUID. The `access: "public"` option makes the blob publicly readable without authentication. The returned `blob.url` is the canonical HTTPS URL that the post tool stores in `GeneratedPost.imageUrl`.

**`@vercel/blob` is stateless:** The Vercel Blob client holds no server-side state between requests. Each call to `put()` is an independent HTTP request to the Blob storage API — there is no caching, connection reuse, or reference tracking across invocations. Every image generation must call `put()` with a unique key (e.g. `posts/${postId}.png` or `feed/${Date.now()}-${type}.png`). Do not attempt to reuse or cache blob references across requests.

### Image generation is optional and should not block the response

Image generation via DALL-E 3 adds 2–4 seconds of latency and can fail independently (content policy, timeout, upload error). Where possible, treat image generation as fire-and-forget or handle it in a retry path that runs separately from the post generation response. In the current v1 implementation, image generation is synchronous within the agent's `maxSteps: 2` budget — if it fails, the agent either posts without an image or is discarded. A future improvement would be to generate the post first, return it immediately, and upload the image asynchronously — updating `GeneratedPost.imageUrl` via a separate write once the upload completes.

### Zod validation order

`z.enum(IMAGE_TYPES)` runs before `execute`. An invalid `type` value (e.g. `"highlight_reel"`) causes a zod parse error that the AI SDK reports to the model as a tool call failure. The model receives the validation error and the step is not counted against `maxSteps`. This means a bad `type` value does not silently burn a step.

### No client exposure

`generatePlayerImageTool` is only ever attached to a `generateText` call inside a Vercel serverless function. The `OPENAI_API_KEY` and `BLOB_READ_WRITE_TOKEN` are server-side secrets. The tool file is in `api/tools/` and is never imported by any file in `src/ui/` or `src/worker/`. ZenGM is a client-side game; this tool represents the only server-side image I/O in the system.

### SDK version note

`experimental_generateImage` is available in `ai` v4+. This project uses `ai: "^6.0.134"` (confirmed in `package.json`), so the API is available. The function remains prefixed with `experimental_` even in v6 — use the exact import name as shown. Do not alias it.

## Verified by

- Calling `execute` with `prompt: "..."` and `type: "stat_card"` returns `{ imageUrl: string }` where the URL begins with `https://`
- The `type` field controls image dimensions: `stat_card` produces a 1792×1024 landscape image; `player_portrait` and `celebration` produce 1024×1024 square images
- Passing `type: "highlight_reel"` (an invalid value) fails zod validation before `execute` runs — no image generation call is made
- The returned URL is publicly accessible — HTTP GET on the URL returns HTTP 200 with `Content-Type: image/png`
- The tool can be imported and attached to a `generateText` call alongside `postTool` without TypeScript errors
- `tsc --noEmit` on `generatePlayerImageTool.ts` passes with zero errors and zero `any`

## Definition of Done

Tool calls image model, uploads result to Vercel Blob, and returns an accessible public HTTPS URL. Zod enforces the `type` enum before `execute` runs. Dimensions are correct per type. The file compiles clean with no `any`. The returned URL passes an HTTP 200 GET check.
