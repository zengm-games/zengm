import { z } from "zod";

/**
 * Tool definitions shared by the Vercel `api/chat` route (model sees these) and
 * the client `onToolCall` handler (executes with `toWorker`).
 * Client-side tools omit `execute` on the server; the browser supplies results via `addToolOutput`.
 */
export const agentChatTools = {
	getStandings: {
		description:
			"Load league standings for a season: each team's record, win %, and league rank. Use this to answer questions about records, playoff positioning, or how a team compares.",
		inputSchema: z.object({
			season: z
				.number()
				.optional()
				.describe(
					"Season year (e.g. 2025). Omit to use the current season from game context.",
				),
		}),
	},
	getRoster: {
		description:
			"Load the user-controlled team's current roster with player ratings, positions, contracts, and injuries.",
		inputSchema: z.object({}),
	},
	getAvailablePlayers: {
		description:
			"Load available free agents (and related cap context) for the current period. Use for questions about who is available to sign.",
		inputSchema: z.object({}),
	},
} as const;
