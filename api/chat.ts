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
		"You are an AI GM assistant for BasketballGM.",
		"Use the tools to read live data from the game. Do not invent statistics, records, or roster details.",
		"When the user asks about team or league records and standings, call getStandings.",
		"When the user asks about their roster or players on their team, call getRoster.",
		"When the user asks about free agents or who is available to sign, call getAvailablePlayers.",
		"You may call multiple tools in sequence if needed.",
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
