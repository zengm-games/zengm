// api/buildPrompt.ts
// Prompt builders for the /api/feed endpoint.
// These are pure functions with no dependencies outside the shared types.
// They are imported by api/feed.ts and can be tested in isolation.

import type {
	AgentConfig,
	FeedEvent,
	ResolvedAgent,
} from "../src/common/types.feedEvent.ts";

// ─── System prompt ────────────────────────────────────────────────────────────

/**
 * Build the per-agent system prompt.
 *
 * Accepts a `ResolvedAgent` (`AgentConfig & { agentId: string; displayName: string }`).
 * Uses `agent.persona` as the character description (primary voice instruction)
 * and `agent.displayName` as the posting identity shown to the model.
 */
export function buildSystemPrompt(agent: ResolvedAgent): string {
	const typeLabel: Record<AgentConfig["type"], string> = {
		journalist: "an insider sports journalist",
		fan: "a passionate fan",
		player: "a professional basketball player",
		org: "the official account of a basketball team",
	};

	return [
		// Persona is the stable character description — always first so the model treats it as primary.
		agent.persona,
		"",
		// displayName tells the model what identity it is posting under.
		`You are posting as ${agent.displayName} — ${typeLabel[agent.type]} — on a Twitter-like social platform inside a basketball simulation game.`,
		"",
		"Write a short social media post — tweet-length, 280 characters maximum.",
		"",
		"CRITICAL OUTPUT FORMAT:",
		"- Your entire response must be ONLY the post text itself",
		"- Do NOT include any code, function calls, JSON, markdown, or formatting",
		"- Do NOT write `post(...)`, `print(...)`, tool calls, or any syntax",
		"- Do NOT include quotes around your response",
		'- Do NOT include a label like "Post:" or "Response:"',
		"- Just write the social media post text directly, nothing else",
		"- Maximum 280 characters",
	].join("\n");
}

// ─── Event prompt ─────────────────────────────────────────────────────────────

/**
 * Build the user-turn prompt describing the event and game context.
 *
 * Accepts a `ResolvedAgent` (for potential agent-specific emphasis in future)
 * and a `FeedEvent` carrying the event type, timestamp, and `SocialContext`.
 *
 * Context truncation limits (applied here before serialization):
 *   - statLeaders: top 5
 *   - recentGames: last 3
 *   - standings: top 5
 *   - players: top 5
 *   - transactions: top 5
 */
export function buildEventPrompt(
	_agent: ResolvedAgent,
	event: FeedEvent,
): string {
	const { context } = event;
	const lines: string[] = [];

	// Event header
	const eventLabels: Record<FeedEvent["type"], string> = {
		GAME_END: "A game just ended.",
		HALFTIME: "It is halftime.",
		TRADE_ALERT: "A trade has just been announced.",
		DRAFT_PICK: "A draft pick was just made.",
		INJURY: "A player has been injured.",
		PLAYER_SIGNING: "A player signing has been announced.",
		SEASON_AWARD: "Season awards have just been announced.",
		PLAYOFF_CLINCH: "A team has just clinched a playoff spot.",
	};

	lines.push(`EVENT: ${eventLabels[event.type]}`, "");

	// Live game state (HALFTIME only)
	if (context.liveGame) {
		const { score, quarter, statLeaders } = context.liveGame;
		lines.push(`LIVE SCORE: ${score[0]} – ${score[1]} (end of Q${quarter})`);
		// Truncate to top 5 stat leaders to keep the prompt compact.
		const truncatedLeaders = statLeaders.slice(0, 5);
		if (truncatedLeaders.length > 0) {
			lines.push("STAT LEADERS:");
			for (const leader of truncatedLeaders) {
				lines.push(
					`  ${leader.playerName} (${leader.teamName}): ${leader.statLabel} ${leader.value}`,
				);
			}
		}
		lines.push("");
	}

	// Teams involved
	if (context.teams.length > 0) {
		lines.push("TEAMS:");
		for (const team of context.teams) {
			lines.push(
				`  ${team.name} (${team.abbrev}) — ${team.wins}–${team.losses}`,
			);
		}
		lines.push("");
	}

	// Players involved — truncated to top 5
	const truncatedPlayers = context.players.slice(0, 5);
	if (truncatedPlayers.length > 0) {
		lines.push("PLAYERS:");
		for (const player of truncatedPlayers) {
			const avg = player.seasonAverages;
			const avgLine = `${avg.pts.toFixed(1)} pts / ${avg.reb.toFixed(1)} reb / ${avg.ast.toFixed(1)} ast`;
			lines.push(
				`  ${player.name} — ${player.position}, ${player.teamName} (${avgLine})`,
			);
		}
		lines.push("");
	}

	// Recent games — truncated to last 3
	const truncatedGames = context.recentGames.slice(0, 3);
	if (truncatedGames.length > 0) {
		lines.push("RECENT GAMES:");
		for (const game of truncatedGames) {
			lines.push(
				`  ${game.homeName} ${game.homeScore} – ${game.awayScore} ${game.awayName}`,
			);
		}
		lines.push("");
	}

	// Standings snapshot — truncated to top 5
	const truncatedStandings = context.standings.slice(0, 5);
	if (truncatedStandings.length > 0) {
		lines.push("STANDINGS (top 5):");
		for (const entry of truncatedStandings) {
			lines.push(
				`  ${entry.name} (${entry.abbrev}) — ${entry.wins}–${entry.losses} (${(entry.pct * 100).toFixed(1)}%)`,
			);
		}
		lines.push("");
	}

	// Recent transactions — truncated to top 5
	const truncatedTransactions = context.transactions.slice(0, 5);
	if (truncatedTransactions.length > 0) {
		lines.push("RECENT TRANSACTIONS:");
		for (const tx of truncatedTransactions) {
			lines.push(`  ${tx.description}`);
		}
		lines.push("");
	}

	lines.push(
		"React to this event in your established voice. Keep your post under 280 characters.",
		"",
		"Write your post now. Output ONLY the post text, nothing else:",
	);

	return lines.join("\n");
}
