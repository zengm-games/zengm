import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { google, type GoogleLanguageModelOptions } from "@ai-sdk/google";
import { agentChatTools } from "../src/common/agentChatTools.ts";
import { gmChatTools } from "../src/common/gmChatTools.ts";
import { buildGmSystemPrompt } from "../src/ui/util/gmSystemPrompt.ts";

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).end("Method Not Allowed");
		return;
	}

	const rawBody = req.body;
	const body =
		typeof rawBody === "string"
			? (JSON.parse(rawBody) as {
					messages: UIMessage[];
					gameContext?: unknown;
					entityContext?: unknown;
				})
			: (rawBody as {
					messages: UIMessage[];
					gameContext?: unknown;
					entityContext?: unknown;
				});

	const { messages, gameContext, entityContext } = body;

	console.log("[api/chat] gameContext", gameContext);
	console.log("[api/chat] entityContext", entityContext);

	if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
		res.status(500).json({
			error:
				"Server misconfiguration: GOOGLE_GENERATIVE_AI_API_KEY is not set.",
		});
		return;
	}

	const isGmChat =
		entityContext != null &&
		typeof entityContext === "object" &&
		"tid" in entityContext;

	let result;

	if (isGmChat) {
		const ec = entityContext as {
			tid: number;
			abbrev: string;
			region: string;
			name: string;
			strategy: "contending" | "rebuilding";
			won: number;
			lost: number;
		};
		const gc = gameContext as {
			phase: number;
			phaseText: string;
			season: number;
			userTid: number;
			userTids: number[];
			spectator: boolean;
			userTeamAbbrev: string | null;
			userTeamName: string | null;
			statusText: string;
			teamsIndex: { tid: number; abbrev: string }[];
		};
		const system = buildGmSystemPrompt(ec, gc);

		result = streamText({
			model: google("gemini-3-flash-preview"),
			system,
			messages: await convertToModelMessages(messages),
			tools: gmChatTools,
			stopWhen: stepCountIs(15),
			providerOptions: {
				google: {
					thinkingConfig: { thinkingLevel: "low" },
				} satisfies GoogleLanguageModelOptions,
			},
		});
	} else {
		const system = [
			"You are an AI GM assistant for BasketballGM, a basketball *simulation* game.",
			"",
			"CRITICAL: This is a simulated league with fictional, randomly-generated players and teams. You have ZERO real-world basketball knowledge that applies here. Every player name, stat, rating, team roster, and record exists only inside this simulation. NEVER reference real NBA players, real NBA teams, real-world stats, or real-world basketball history. If you are unsure about any fact, call a tool — do not guess or rely on outside knowledge.",
			"",
			"ALWAYS call a tool before answering questions about players, teams, standings, rosters, or free agents. The tool results are the single source of truth. Do not invent, assume, or hallucinate any statistics, ratings, records, or roster details.",
			"",
			"Tool usage guidelines:",
			"- getStandings: Call when the user asks about team records, playoff positioning, or league rankings.",
			"- getRoster: Call to see a team's players, ratings, contracts, and injuries. Omit teamAbbrev for the user's team; pass teamAbbrev (e.g. CHI, LAL) for another team.",
			"- getAvailablePlayers: Call when the user asks about free agents or who is available to sign.",
			"- getPlayer: Call for deep detail on one player (full stats, ratings history, contract, etc.). Get the pid from getRoster or getAvailablePlayers first if the user only gave a name.",
			"- Before proposeTrade, call getRoster for both the user's team and the other team so pid values are accurate.",
			"- For irreversible actions (releasePlayer, draftPick, proposeTrade), ask the user to confirm before calling the tool.",
			"- Low-impact actions (sortRoster, updatePlayingTime) may be executed immediately when requested.",
			"- You may call multiple tools in sequence if needed.",
			"",
			"Player references: When mentioning a player whose pid you know from a tool result, ALWAYS format their name as a Markdown link: [Player Name](player:PID). For example, [John Smith](player:42). This makes player names clickable for the user. Only link players whose pid you have confirmed from a tool — never guess a pid.",
			"",
			"Tone: You're texting the user, not writing a report. Keep it casual and conversational — short sentences, fragments are fine. Sound like a helpful assistant shooting quick texts. 1-3 sentences per message usually. Break longer answers into short paragraphs.",
			"",
			'CRITICAL OUTPUT RULE: Your response must ONLY contain helpful text for the user. NEVER output internal reasoning, chain-of-thought analysis, "wait" or "let me think" monologues, or any behind-the-scenes thought process. The user sees everything you write. Reason silently before responding. Never display raw player IDs as plain text — only embed them inside Markdown links as described above.',
			"",
			"Current game context (JSON):",
			JSON.stringify(gameContext ?? {}),
		].join("\n");

		result = streamText({
			model: google("gemini-3-flash-preview"),
			system,
			messages: await convertToModelMessages(messages),
			tools: agentChatTools,
			stopWhen: stepCountIs(15),
			providerOptions: {
				google: {
					thinkingConfig: { thinkingLevel: "low" },
				} satisfies GoogleLanguageModelOptions,
			},
		});
	}

	result.pipeUIMessageStreamToResponse(res);
}
