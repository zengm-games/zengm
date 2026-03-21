import { z } from "zod";

export const gmChatTools = {
	getMyRoster: {
		description:
			"Load the roster for your team (the GM's team) including players, ratings, positions, contracts, and injuries. Use this to check which players you have available for trades.",
		inputSchema: z.object({}),
	},
	getUserTeamRoster: {
		description:
			"Load the user's team roster including players, ratings, positions, contracts, and injuries. Use this to see what the user has available to offer in a trade.",
		inputSchema: z.object({}),
	},
	evaluateTrade: {
		description:
			"Evaluate a proposed trade to assess how it affects your team's value. Returns a qualitative assessment. Call this BEFORE accepting any trade to understand the impact. Use player ids (pid) from getMyRoster and getUserTeamRoster results.",
		inputSchema: z.object({
			myPids: z
				.array(z.number().int())
				.optional()
				.describe("Player ids from YOUR roster that you would give up."),
			myDpids: z
				.array(z.number().int())
				.optional()
				.describe("Draft pick ids from YOUR team that you would give up."),
			userPids: z
				.array(z.number().int())
				.optional()
				.describe("Player ids from the USER's roster that you would receive."),
			userDpids: z
				.array(z.number().int())
				.optional()
				.describe("Draft pick ids from the USER's team that you would receive."),
		}),
	},
	acceptTrade: {
		description:
			"Finalize and execute a trade. This is IRREVERSIBLE. Only call this when you have decided to accept the trade after evaluating it with evaluateTrade. Uses the same asset parameters.",
		inputSchema: z.object({
			myPids: z
				.array(z.number().int())
				.optional()
				.describe("Player ids from YOUR roster that you would give up."),
			myDpids: z
				.array(z.number().int())
				.optional()
				.describe("Draft pick ids from YOUR team that you would give up."),
			userPids: z
				.array(z.number().int())
				.optional()
				.describe("Player ids from the USER's roster that you would receive."),
			userDpids: z
				.array(z.number().int())
				.optional()
				.describe("Draft pick ids from the USER's team that you would receive."),
		}),
	},
} as const;

export type GmChatToolName = keyof typeof gmChatTools;
