import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
	convertToModelMessages,
	stepCountIs,
	streamText,
	type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { agentChatTools } from "../src/common/agentChatTools.ts";

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
				})
			: (rawBody as {
					messages: UIMessage[];
					gameContext?: unknown;
				});

	const { messages, gameContext } = body;

	console.log("[api/chat] gameContext", gameContext);

	if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
		res.status(500).json({
			error:
				"Server misconfiguration: GOOGLE_GENERATIVE_AI_API_KEY is not set.",
		});
		return;
	}

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
		"Current game context (JSON):",
		JSON.stringify(gameContext ?? {}),
	].join("\n");

	const result = streamText({
		model: google("gemini-3-flash-preview"),
		system,
		messages: await convertToModelMessages(messages),
		tools: agentChatTools,
		stopWhen: stepCountIs(15),
	});

	result.pipeUIMessageStreamToResponse(res);
}
