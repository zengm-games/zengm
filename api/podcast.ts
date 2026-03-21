import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateText } from "ai";

export type PodcastInput = {
	gid: number;
	season: number;
	playoffs: boolean;
	homeTeam: string;
	awayTeam: string;
	homeScore: number;
	awayScore: number;
	overtimes: number;
	homePlayers: PlayerStat[];
	awayPlayers: PlayerStat[];
	homeRecord: string;
	awayRecord: string;
};

type PlayerStat = {
	name: string;
	pts: number;
	reb: number;
	ast: number;
	stl: number;
	blk: number;
	fg: string; // "8/15"
	tp: string; // "3/7"
	ft: string; // "4/5"
	min: number;
};

function buildPrompt(input: PodcastInput): string {
	const winner =
		input.homeScore > input.awayScore ? input.homeTeam : input.awayTeam;
	const loser =
		input.homeScore > input.awayScore ? input.awayTeam : input.homeTeam;
	const winScore = Math.max(input.homeScore, input.awayScore);
	const loseScore = Math.min(input.homeScore, input.awayScore);

	const allPlayers = [
		...input.homePlayers.map(p => ({ ...p, team: input.homeTeam })),
		...input.awayPlayers.map(p => ({ ...p, team: input.awayTeam })),
	];
	const topScorer = allPlayers.reduce((best, p) =>
		p.pts > best.pts ? p : best,
	);
	const topRebounder = allPlayers.reduce((best, p) =>
		p.reb > best.reb ? p : best,
	);

	const otText =
		input.overtimes > 0
			? ` after ${input.overtimes === 1 ? "overtime" : `${input.overtimes} overtimes`}`
			: "";
	const playoffText = input.playoffs ? " in the playoffs" : "";

	const statsJson = JSON.stringify(
		{
			game: {
				winner,
				loser,
				score: `${winScore}-${loseScore}`,
				overtime: input.overtimes > 0,
				playoffs: input.playoffs,
				homeTeam: input.homeTeam,
				awayTeam: input.awayTeam,
				homeRecord: input.homeRecord,
				awayRecord: input.awayRecord,
				season: input.season,
			},
			topPerformers: allPlayers
				.sort((a, b) => b.pts - a.pts)
				.slice(0, 5)
				.map(p => ({
					name: p.name,
					team: p.team,
					pts: p.pts,
					reb: p.reb,
					ast: p.ast,
					stl: p.stl,
					blk: p.blk,
					fg: p.fg,
					tp: p.tp,
					ft: p.ft,
					min: p.min,
				})),
		},
		null,
		2,
	);

	return `You are producing an "Inside the NBA" studio show podcast for a basketball simulation game.

The three hosts are:
- Ernie: Ernie Johnson — polished TV host, professional, asks sharp follow-up questions, occasionally deadpans
- Charles: Charles Barkley — blunt, opinionated, never afraid to criticize, Southern expressions ("I tell you what", "that's just terrible"), loves bold takes
- Shaq: Shaquille O'Neal — big personality, playful banter with Charles, drops jokes, occasionally goes serious on dominant performances

Write a 2–3 minute natural back-and-forth podcast discussion. No stage directions. No asterisks. Cover:
1. Open with the final score and storyline (${winner} beat ${loser} ${winScore}-${loseScore}${otText}${playoffText})
2. Break down the top performance from ${topScorer.name} (${topScorer.pts} pts, ${topScorer.reb} reb, ${topScorer.ast} ast)
3. ${topRebounder.name !== topScorer.name ? `Note ${topRebounder.name}'s rebounding (${topRebounder.reb} reb)` : "Discuss a second standout performance"}
4. Charles gives a hot take — either praising the winner or roasting the loser
5. Close with a quick look ahead

Game data:
${statsJson}

Format every line as:
Ernie: [dialogue]
Charles: [dialogue]
Shaq: [dialogue]

Keep it energetic, fun, and authentic to each host's voice. Minimum 20 exchanges.`;
}

async function generateAudio(
	script: string,
	apiKey: string,
): Promise<{ audioData: string; mimeType: string }> {
	// Gemini 2.5 Flash Preview TTS — multi-speaker, requires Google REST API directly
	// Voice assignments: Ernie=Charon (warm/smooth), Charles=Fenrir (bold), Shaq=Orus (deep)
	const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

	const response = await fetch(url, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			contents: [
				{
					parts: [{ text: script }],
					role: "user",
				},
			],
			generationConfig: {
				responseModalities: ["AUDIO"],
				speechConfig: {
					multiSpeakerVoiceConfig: {
						speakerVoiceConfigs: [
							{
								speaker: "Ernie",
								voiceConfig: {
									prebuiltVoiceConfig: { voiceName: "Charon" },
								},
							},
							{
								speaker: "Charles",
								voiceConfig: {
									prebuiltVoiceConfig: { voiceName: "Fenrir" },
								},
							},
							{
								speaker: "Shaq",
								voiceConfig: {
									prebuiltVoiceConfig: { voiceName: "Orus" },
								},
							},
						],
					},
				},
			},
		}),
	});

	if (!response.ok) {
		const text = await response.text();
		throw new Error(`Gemini TTS error ${response.status}: ${text}`);
	}

	const json = (await response.json()) as {
		candidates: Array<{
			content: {
				parts: Array<{
					inlineData?: { mimeType: string; data: string };
				}>;
			};
		}>;
	};

	const part = json.candidates?.[0]?.content?.parts?.[0]?.inlineData;
	if (!part) {
		throw new Error("No audio data in Gemini TTS response");
	}

	return { audioData: part.data, mimeType: part.mimeType };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
	if (req.method !== "POST") {
		res.status(405).end("Method Not Allowed");
		return;
	}

	const googleKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
	const gatewayKey = process.env.AI_GATEWAY_API_KEY;

	if (!googleKey && !gatewayKey) {
		res.status(500).json({
			error:
				"Server misconfiguration: set GOOGLE_GENERATIVE_AI_API_KEY or AI_GATEWAY_API_KEY",
		});
		return;
	}

	const rawBody = req.body;
	const input: PodcastInput =
		typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;

	// Step 1: Generate the Inside the NBA script
	// If AI_GATEWAY_API_KEY is set, route through Vercel AI Gateway (google provider)
	// Otherwise use Google AI SDK directly
	let script: string;

	if (gatewayKey) {
		// Vercel AI Gateway: configure @ai-sdk/google to use gateway base URL
		const google = createGoogleGenerativeAI({
			apiKey: gatewayKey,
			baseURL: "https://ai-gateway.vercel.sh/v1/providers/google",
		});

		const { text } = await generateText({
			model: google("gemini-2.5-flash"),
			prompt: buildPrompt(input),
			maxTokens: 2000,
		});
		script = text;
	} else {
		// Direct Google AI SDK
		const google = createGoogleGenerativeAI({
			apiKey: googleKey!,
		});

		const { text } = await generateText({
			model: google("gemini-2.5-flash"),
			prompt: buildPrompt(input),
			maxTokens: 2000,
		});
		script = text;
	}

	if (!script) {
		res.status(500).json({ error: "Empty script generated" });
		return;
	}

	// Step 2: Convert script to multi-speaker audio via Gemini TTS REST API
	// Gemini TTS requires Google's native REST format (not OpenAI-compatible)
	// so we call Google's API directly regardless of gateway config
	const ttsKey = googleKey ?? gatewayKey!;
	const { audioData, mimeType } = await generateAudio(script, ttsKey);

	res.status(200).json({ audioData, mimeType });
}
