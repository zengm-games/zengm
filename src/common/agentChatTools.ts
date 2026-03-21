import { z } from "zod";

// Gemini function-declaration enums must be strings (TYPE_STRING), not numbers.
const ptModifierSchema = z.enum(["0", "0.75", "1", "1.25", "1.5"]);

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
			"Load a team's roster for the current season with ratings, positions, contracts, and injuries. Omit teamAbbrev for the user-controlled team. Pass teamAbbrev (e.g. ATL, BOS) to inspect another team before trades.",
		inputSchema: z.object({
			teamAbbrev: z
				.string()
				.optional()
				.describe(
					"Team abbreviation from the game (e.g. LAL). Omit to load the user's team.",
				),
		}),
	},
	getAvailablePlayers: {
		description:
			"Load available free agents (and related cap context) for the current period. Use for questions about who is available to sign.",
		inputSchema: z.object({}),
	},
	getPlayer: {
		description:
			"Load the full player profile for a single player by pid (ratings history, stats, contract, injuries, feats, etc.). Use pid from getRoster or getAvailablePlayers. If the user names a player, call getRoster or getAvailablePlayers first to find their pid, then call getPlayer.",
		inputSchema: z.object({
			pid: z
				.number()
				.int()
				.describe(
					"Player id from a prior tool result in this league (e.g. getRoster or getAvailablePlayers).",
				),
		}),
	},
	sortRoster: {
		description:
			"Auto-sort the user team's depth chart by rating. Optional basketball position (PG, SG, SF, PF, C, G, F) limits sorting to one position group.",
		inputSchema: z.object({
			pos: z
				.string()
				.optional()
				.describe(
					"Basketball position to sort (e.g. PG). Omit to sort the full roster.",
				),
		}),
	},
	updatePlayingTime: {
		description:
			"Set playing time modifier for a player on the user roster. Pass string values matching the PT dropdown: \"0\" (DNP), \"0.75\" (-), \"1\" (normal), \"1.25\" (+), \"1.5\" (++).",
		inputSchema: z.object({
			pid: z.number().int().describe("Player id from getRoster."),
			ptModifier: ptModifierSchema.describe("Playing time tier."),
		}),
	},
	releasePlayer: {
		description:
			"Release (waive/cut) a player from the user team. Irreversible: only call after the user explicitly confirms they want this player released.",
		inputSchema: z.object({
			pid: z.number().int().describe("Player id from getRoster."),
		}),
	},
	draftPick: {
		description:
			"Select a player in the draft on behalf of the user when it is their pick. Irreversible: only call after the user explicitly confirms the prospect and pick.",
		inputSchema: z.object({
			pid: z
				.number()
				.int()
				.describe("Prospect player id from draft or scouting views."),
		}),
	},
	proposeTrade: {
		description:
			"Build and propose a trade to another team. Call getRoster without teamAbbrev and getRoster with the other team's teamAbbrev first to obtain pid values. Irreversible for cap/roster: only call after the user explicitly confirms the full trade. Native confirmation dialogs may still appear for edge cases.",
		inputSchema: z.object({
			otherTeamAbbrev: z
				.string()
				.describe("Other team's abbreviation (e.g. NYK)."),
			userPids: z
				.array(z.number().int())
				.optional()
				.describe("Player ids the user gives up."),
			userDpids: z
				.array(z.number().int())
				.optional()
				.describe("Draft pick ids the user gives up (if known)."),
			otherPids: z
				.array(z.number().int())
				.optional()
				.describe("Player ids the user receives from the other team."),
			otherDpids: z
				.array(z.number().int())
				.optional()
				.describe("Draft pick ids the user receives (if known)."),
		}),
	},
} as const;

export type AgentChatToolName = keyof typeof agentChatTools;
