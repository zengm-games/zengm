// feedWorker.ts — standalone Web Worker for the agent social feed.
//
// Message protocol:
//   RECEIVES: FeedEvent (sent from the game worker via postMessage)
//   SENDS:    { type: "postsReady"; count: number } (back to the game worker)
//
// Responsibilities:
//   1. Enqueue incoming FeedEvents with backpressure (serial, one at a time).
//   2. For each event:
//      a. Load all active accounts from socialFeedDb.
//      b. Filter to accounts whose templateId maps to an AgentConfig that
//         has the event type in its triggers list.
//      c. Build ResolvedAgent[] from the static config map + account metadata.
//      d. POST to /api/feed (or FEED_API_URL env override) with { event, agents }.
//      e. Persist each returned GeneratedPost via addPost().
//      f. Report back with { type: "postsReady", count }.

import type {
	FeedEvent,
	AgentConfig,
	ResolvedAgent,
	GeneratedPost,
} from "../common/types.feedEvent.ts";
import { getAllAccounts, addPost } from "./util/feedDb.ts";

// ─── Static agent config map ──────────────────────────────────────────────────
// Import each Phase-2 JSON individually so the bundler can tree-shake and
// resolve them at build time. The map key must match Account.templateId.

import shamCharania from "../data/socialAgents/journalists/sham_charania.json";
import fanBandwagon from "../data/socialAgents/fans/bandwagon.json";
import fanHater from "../data/socialAgents/fans/hater.json";
import fanHomer from "../data/socialAgents/fans/homer.json";
import fanStatNerd from "../data/socialAgents/fans/stat_nerd.json";
import orgTemplate from "../data/socialAgents/orgs/template.json";
import playerTemplate from "../data/socialAgents/players/template.json";

const configMap: Record<string, AgentConfig> = {
	sham_charania: shamCharania as AgentConfig,
	fan_casual: fanBandwagon as AgentConfig,
	fan_hater: fanHater as AgentConfig,
	fan_homer: fanHomer as AgentConfig,
	fan_stat_nerd: fanStatNerd as AgentConfig,
	org_template: orgTemplate as AgentConfig,
	player_template: playerTemplate as AgentConfig,
};

// ─── Feed API endpoint ────────────────────────────────────────────────────────
// Use process.env (Rolldown) — NOT import.meta.env.
const FEED_API_URL: string =
	(typeof process !== "undefined" && process.env?.FEED_API_URL) || "/api/feed";

// ─── Core event handler ───────────────────────────────────────────────────────

async function handleEvent(event: FeedEvent): Promise<void> {
	// a. Load all accounts from IndexedDB.
	const allAccounts = await getAllAccounts();

	// b. Filter to active accounts whose templateId has a config that triggers
	//    on this event type.
	const triggeredAccounts = allAccounts.filter((account) => {
		const config = configMap[account.templateId];
		return config !== undefined && config.triggers.includes(event.type);
	});

	if (triggeredAccounts.length === 0) {
		return;
	}

	// c. Build ResolvedAgent[] — merge AgentConfig fields with account identity.
	const agents: ResolvedAgent[] = triggeredAccounts.map((account) => {
		const config = configMap[account.templateId]!;
		return {
			// AgentConfig fields
			...config,
			// ResolvedAgent extras (overwrite id with agentId, keep handle from account)
			agentId: account.agentId,
			displayName: account.displayName,
			// Use the account's handle so org/player accounts have their real handle.
			handle: account.handle,
		};
	});

	// d. POST to the feed API.
	let posts: GeneratedPost[] = [];

	const response = await fetch(FEED_API_URL, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({ event, agents }),
	});

	if (!response.ok) {
		throw new Error(
			`[feedWorker] POST ${FEED_API_URL} returned ${response.status} ${response.statusText}`,
		);
	}

	const data = (await response.json()) as { posts: GeneratedPost[] };
	posts = data.posts ?? [];

	// e. Persist each returned post.
	await Promise.all(posts.map((post) => addPost(post)));

	// f. Report back to the game worker.
	self.postMessage({ type: "postsReady", count: posts.length });
}

// ─── Serial queue with backpressure ──────────────────────────────────────────

const queue: FeedEvent[] = [];
let processing = false;

async function processNext(): Promise<void> {
	if (queue.length === 0) {
		processing = false;
		return;
	}
	processing = true;
	const event = queue.shift()!;
	await handleEvent(event).catch((err) => console.error("[feedWorker]", err));
	processNext();
}

function enqueue(event: FeedEvent): void {
	queue.push(event);
	if (!processing) processNext();
}

// ─── Message entry point ──────────────────────────────────────────────────────

self.onmessage = (e: MessageEvent) => {
	enqueue(e.data as FeedEvent);
};
