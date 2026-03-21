// Phase 3a: Account Initialization
// Seeds all social feed accounts on first run and keeps player accounts in sync
// across trades, signings, and cuts. Both functions are fully idempotent.

import type {
	Account,
	AgentConfig,
	TeamSummary,
	PlayerSummary,
} from "../../common/types.feedEvent.ts";
import { getAccount, putAccount, getAllAccounts } from "./feedDb.ts";

// ─── Phase 2 static template imports ─────────────────────────────────────────

import shamCharania from "../../data/socialAgents/journalists/sham_charania.json";
import fanHomer from "../../data/socialAgents/fans/homer.json";
import fanStatNerd from "../../data/socialAgents/fans/stat_nerd.json";
import fanBandwagon from "../../data/socialAgents/fans/bandwagon.json";
import fanHater from "../../data/socialAgents/fans/hater.json";
import playerTemplate from "../../data/socialAgents/players/template.json";
import orgTemplate from "../../data/socialAgents/orgs/template.json";

// Grouped template lists — extend these arrays when Phase 2 ships new configs.
const journalistTemplates: AgentConfig[] = [shamCharania as AgentConfig];

const fanTemplates: AgentConfig[] = [
	fanHomer as AgentConfig,
	fanStatNerd as AgentConfig,
	fanBandwagon as AgentConfig,
	fanHater as AgentConfig,
];

// ─── Handle collision helper ──────────────────────────────────────────────────

/**
 * Builds a handle for a player account, detecting collisions by checking all
 * existing accounts. If the derived handle is already taken by another account,
 * the player's pid is appended to make it unique.
 *
 * @param name  - Player display name (e.g. "LeBron James")
 * @param pid   - Player id used as tiebreaker suffix on collision
 * @param existingHandles - Set of handles already in use
 */
function buildPlayerHandle(
	name: string,
	pid: number,
	existingHandles: Set<string>,
): string {
	const base = name.toLowerCase().replace(/\s+/g, "_");
	if (!existingHandles.has(base)) {
		return base;
	}
	return `${base}_${pid}`;
}

// ─── initializeFeedAccounts ───────────────────────────────────────────────────

/**
 * Seeds all accounts on the first run of the feed system for a league.
 * Idempotent: safe to call any number of times — existing records are never
 * overwritten or duplicated.
 *
 * Creates:
 *  - One account per journalist template
 *  - One account per fan archetype template
 *  - One org account per team (type "org")
 *  - One player account per rostered player (tid !== -1)
 *
 * Free agents (tid === -1) are skipped; syncPlayerAccounts picks them up
 * when they are signed.
 */
export async function initializeFeedAccounts(
	teams: TeamSummary[],
	players: PlayerSummary[],
): Promise<void> {
	const now = Date.now();

	// ── 1. Journalist accounts ──────────────────────────────────────────────
	for (const template of journalistTemplates) {
		const agentId = template.id;
		const existing = await getAccount(agentId);
		if (existing) {
			continue;
		}
		const account: Account = {
			agentId: template.id,
			handle: template.handle,
			displayName: template.handle,
			type: "journalist",
			pid: null,
			tid: null,
			templateId: template.id,
			status: "active",
			avatarUrl: null,
			createdAt: now,
		};
		await putAccount(account);
	}

	// ── 2. Fan accounts ─────────────────────────────────────────────────────
	for (const template of fanTemplates) {
		const agentId = template.id;
		const existing = await getAccount(agentId);
		if (existing) {
			continue;
		}
		const account: Account = {
			agentId: template.id,
			handle: template.handle,
			displayName: template.handle,
			type: "fan",
			pid: null,
			tid: null,
			templateId: template.id,
			status: "active",
			avatarUrl: null,
			createdAt: now,
		};
		await putAccount(account);
	}

	// ── 3. Org accounts (one per team) ──────────────────────────────────────
	const org = orgTemplate as AgentConfig;
	for (const team of teams) {
		const agentId = `team_${team.tid}`;
		const existing = await getAccount(agentId);
		if (existing) {
			continue;
		}
		const account: Account = {
			agentId,
			handle: team.abbrev.toLowerCase(),
			displayName: `${team.name} Official`,
			type: "org",
			pid: null,
			tid: team.tid,
			templateId: org.id,
			status: "active",
			avatarUrl: null,
			createdAt: now,
		};
		await putAccount(account);
	}

	// ── 4. Player accounts (rostered players only) ──────────────────────────
	const player = playerTemplate as AgentConfig;

	// Build the set of handles already in the DB to detect collisions.
	const allAccounts = await getAllAccounts();
	const existingHandles = new Set(allAccounts.map((a) => a.handle));

	for (const p of players) {
		if (p.tid === -1) {
			// Free agent — skip; picked up by syncPlayerAccounts when signed.
			continue;
		}
		const agentId = `player_${p.pid}`;
		const existing = await getAccount(agentId);
		if (existing) {
			continue;
		}
		const handle = buildPlayerHandle(p.name, p.pid, existingHandles);
		existingHandles.add(handle); // track so subsequent players in this loop don't collide
		const account: Account = {
			agentId,
			handle,
			displayName: p.name,
			type: "player",
			pid: p.pid,
			tid: p.tid,
			templateId: player.id,
			status: "active",
			avatarUrl: null,
			createdAt: now,
		};
		await putAccount(account);
	}
}

// ─── syncPlayerAccounts ───────────────────────────────────────────────────────

/**
 * Syncs player accounts after any game phase change that updates player
 * roster/team state. Safe to call multiple times — only writes when state
 * actually changes.
 *
 * Rules per player:
 *  - No account + rostered (tid !== -1)  → create new active account
 *  - Existing account + rostered + tid changed → update tid, set active
 *  - Existing account + rostered + same tid   → no-op
 *  - Existing account + free agent (tid === -1) → set status dormant
 *  - No account + free agent               → no-op
 */
export async function syncPlayerAccounts(
	players: PlayerSummary[],
): Promise<void> {
	const now = Date.now();
	const player = playerTemplate as AgentConfig;

	// Build handle set from all existing accounts for collision detection when
	// creating new accounts within this sync pass.
	const allAccounts = await getAllAccounts();
	const existingHandles = new Set(allAccounts.map((a) => a.handle));

	for (const p of players) {
		const agentId = `player_${p.pid}`;
		const existing = await getAccount(agentId);

		if (!existing) {
			// No account exists yet.
			if (p.tid === -1) {
				// Free agent with no account — nothing to do.
				continue;
			}
			// Rostered player without an account — create one.
			const handle = buildPlayerHandle(p.name, p.pid, existingHandles);
			existingHandles.add(handle);
			const account: Account = {
				agentId,
				handle,
				displayName: p.name,
				type: "player",
				pid: p.pid,
				tid: p.tid,
				templateId: player.id,
				status: "active",
				avatarUrl: null,
				createdAt: now,
			};
			await putAccount(account);
		} else {
			// Account already exists.
			if (p.tid === -1) {
				// Player was cut or released — dormant the account.
				if (existing.status !== "dormant") {
					existing.status = "dormant";
					await putAccount(existing);
				}
			} else {
				// Player is rostered.
				if (existing.tid !== p.tid || existing.status !== "active") {
					// Traded or re-signed after being dormant — update tid and reactivate.
					existing.tid = p.tid;
					existing.status = "active";
					await putAccount(existing);
				}
				// Same team and already active — no-op.
			}
		}
	}
}
