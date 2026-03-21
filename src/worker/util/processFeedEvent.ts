// processFeedEvent.ts — processes a FeedEvent inline in the game worker.
//
// This is the same logic as feedWorker.ts but runs as a regular async module
// (no separate Web Worker spawn needed). Called fire-and-forget from emitFeedEvent.

import type {
	AgentConfig,
	FeedEvent,
	GeneratedPost,
	ResolvedAgent,
} from "../../common/types.feedEvent.ts";
import { getAllAccounts, addPost } from "./feedDb.ts";

import shamCharania from "../../data/socialAgents/journalists/sham_charania.json";
import fanBandwagon from "../../data/socialAgents/fans/bandwagon.json";
import fanHater from "../../data/socialAgents/fans/hater.json";
import fanHomer from "../../data/socialAgents/fans/homer.json";
import fanStatNerd from "../../data/socialAgents/fans/stat_nerd.json";
import orgTemplate from "../../data/socialAgents/orgs/template.json";
import playerTemplate from "../../data/socialAgents/players/template.json";

const configMap: Record<string, AgentConfig> = {
	sham_charania: shamCharania as AgentConfig,
	fan_casual: fanBandwagon as AgentConfig,
	fan_hater: fanHater as AgentConfig,
	fan_homer: fanHomer as AgentConfig,
	fan_stat_nerd: fanStatNerd as AgentConfig,
	org_template: orgTemplate as AgentConfig,
	player_template: playerTemplate as AgentConfig,
};

const FEED_API_URL: string =
	(typeof process !== "undefined" && process.env?.FEED_API_URL) ||
	(typeof self !== "undefined" && self.location?.origin
		? `${self.location.origin}/api/feed`
		: "/api/feed");
console.log("[feed:init] FEED_API_URL:", FEED_API_URL);

// Serial queue — one event processed at a time, no backpressure buildup.
const queue: FeedEvent[] = [];
let processing = false;

async function handleEvent(event: FeedEvent): Promise<void> {
	console.log("[feed:process] handleEvent start:", event.type);
	const allAccounts = await getAllAccounts();
	console.log("[feed:process] accounts loaded:", allAccounts.length);

	const triggeredAccounts = allAccounts.filter((account) => {
		const config = configMap[account.templateId];
		return config !== undefined && config.triggers.includes(event.type);
	});

	// Pick one random account per templateId to get diverse voices, not 553 of the same type.
	const byTemplate = new Map<string, typeof triggeredAccounts>();
	for (const account of triggeredAccounts) {
		const bucket = byTemplate.get(account.templateId) ?? [];
		bucket.push(account);
		byTemplate.set(account.templateId, bucket);
	}
	const sampled = [...byTemplate.values()].map(
		(bucket) => bucket[Math.floor(Math.random() * bucket.length)],
	);
	console.log(
		"[feed:process] triggered accounts:",
		triggeredAccounts.length,
		"sampled:",
		sampled.length,
	);

	if (sampled.length === 0) {
		console.log("[feed:process] no triggered accounts, skipping");
		return;
	}

	const agents: ResolvedAgent[] = sampled.map((account) => {
		const config = configMap[account.templateId]!;
		return {
			...config,
			agentId: account.agentId,
			displayName: account.displayName,
			handle: account.handle,
		};
	});

	console.log(
		"[feed:process] POSTing to",
		FEED_API_URL,
		"with",
		agents.length,
		"agents",
	);
	let response: Response;
	try {
		response = await fetch(FEED_API_URL, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ event, agents }),
		});
	} catch (fetchErr) {
		console.error("[feed:process] fetch FAILED (network error):", fetchErr);
		throw fetchErr;
	}
	console.log("[feed:process] response status:", response.status);

	if (!response.ok) {
		const text = await response.text().catch(() => "(unreadable)");
		console.error("[feed:process] error body:", text);
		throw new Error(
			`[feed] POST ${FEED_API_URL} returned ${response.status} ${response.statusText}: ${text}`,
		);
	}

	let data: { posts: GeneratedPost[] };
	try {
		data = (await response.json()) as { posts: GeneratedPost[] };
	} catch (jsonErr) {
		console.error("[feed:process] failed to parse JSON response:", jsonErr);
		throw jsonErr;
	}
	const posts = data.posts ?? [];
	console.log("[feed:process] posts received:", posts.length);
	for (const post of posts) {
		console.log(`[feed:post] @${post.handle}: ${post.body}`);
	}
	await Promise.all(posts.map((post) => addPost(post)));
	console.log(`[feed:process] ${event.type}: saved ${posts.length} post(s)`);
}

async function processNext(): Promise<void> {
	console.log(
		"[feed:queue] processNext called, queue:",
		queue.length,
		"processing:",
		processing,
	);
	try {
		if (queue.length === 0) {
			processing = false;
			return;
		}
		processing = true;
		const event = queue.shift()!;
		await handleEvent(event).catch((err) =>
			console.error("[feed] error processing event:", err),
		);
		void processNext();
	} catch (err) {
		console.error("[feed:queue] processNext threw synchronously:", err);
		processing = false;
	}
}

export function processFeedEvent(event: FeedEvent): void {
	console.log(
		"[feed:process] enqueuing:",
		event.type,
		"queue length:",
		queue.length,
	);
	queue.push(event);
	console.log(
		"[feed:process] queue after push:",
		queue.length,
		"processing:",
		processing,
	);
	if (!processing) {
		console.log("[feed:process] kicking off processNext");
		void processNext();
	} else {
		console.log("[feed:process] already processing, event will be picked up");
	}
}
