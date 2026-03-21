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
});
