# Phase 3a: Account Initialization

## Contract

When the feed system is opened for a league for the first time, all non-player accounts (org, journalist, fan) are seeded into `socialFeedDb.accounts`. Player accounts are created for all rostered players (players with `tid !== -1`). Free agents do not get accounts. After this phase, every agent that can be triggered has a corresponding `Account` record in the accounts store.

Initialization is idempotent: running it multiple times on the same league produces no duplicate accounts and does not overwrite existing records.

## Depends on

- **Phase 1** — `Account`, `AgentConfig`, `TeamSummary`, `PlayerSummary` types in `src/common/types.feedEvent.ts`
- **Phase 2** — Agent template configs (static JSON files in `src/data/socialAgents/`). These define every journalist, fan, and org template `AgentConfig`. Phase 3a reads them to populate `handle`, `templateId`, and account `type`.
- **Phase 3** — `socialFeedDb` exists with an `accounts` object store keyed by `agentId`. The helper functions `getAccount`, `putAccount`, `getAllAccounts`, `getAccountByPid`, `getAccountByTid`, and `getAccountsByType` are exported from `src/ui/db/socialFeedDb.ts` and available before Phase 3a runs. `putAccount` is the required import for all account writes in this file.

## Delivers

- `src/ui/db/initializeAccounts.ts` — seeding logic called on feed system init and after phase changes
  The file exports:

```typescript
export async function initializeFeedAccounts(
	teams: TeamSummary[],
	players: PlayerSummary[],
): Promise<void>;

export async function syncPlayerAccounts(
	players: PlayerSummary[],
): Promise<void>;
```

## Account ID Conventions

Each account's `agentId` is the stable primary key in the `accounts` store. The conventions are:

| Account Type | `agentId` format         | Example           |
| ------------ | ------------------------ | ----------------- |
| Journalist   | matches `AgentConfig.id` | `"sham_charania"` |
| Fan          | matches `AgentConfig.id` | `"fan_homer_1"`   |
| Org          | `"team_${tid}"`          | `"team_3"`        |
| Player       | `"player_${pid}"`        | `"player_142"`    |

**Journalist and fan** agentIds come directly from the static `AgentConfig.id` field in the Phase 2 JSON templates. There is a one-to-one relationship between each template and exactly one account record. The `agentId` used when inserting an `Account` record **must exactly match** the `id` field of the corresponding `AgentConfig` — no transformation, no suffix, no remapping.

Phase 2 fan configs use the following `id` values (these are the canonical agentIds for fan accounts):

| Phase 2 `AgentConfig.id` | Account `agentId` | Archetype        |
| ------------------------ | ----------------- | ---------------- |
| `"fan_homer"`            | `"fan_homer"`     | Hometown homer   |
| `"fan_casual"`           | `"fan_casual"`    | Casual fan       |
| `"fan_stat_nerd"`        | `"fan_stat_nerd"` | Stats enthusiast |
| `"fan_hater"`            | `"fan_hater"`     | Contrarian/hater |

If Phase 2 ships additional fan or journalist configs, their `AgentConfig.id` values become the agentIds automatically — no changes to Phase 3a logic are required, because the loop iterates over whatever templates are present.

**Org** accounts are created dynamically, one per team. The `agentId` is computed as `"team_${tid}"` where `tid` is `TeamSummary.tid`. The `templateId` field is set to the org template id from Phase 2 (e.g. `"team_org_template"`), which all org accounts share. The display name is `"{teamName} Official"`.

**Player** accounts are created dynamically, one per eligible player. The `agentId` is `"player_${pid}"` where `pid` is `PlayerSummary.pid`. The `templateId` field is set to the player template id from Phase 2 (e.g. `"player_template"`), shared by all player accounts. The display name is the player's actual name from `PlayerSummary.name`.

## `initializeFeedAccounts()` Implementation

Called from the **Feed Worker** during worker initialization — not from the main thread or from a UI React component. The Feed Worker calls `initializeFeedAccounts` once when it starts up (or reconnects to a league). Because the worker may be terminated and restarted, this function must be fully idempotent: it is safe to call any number of times on the same league and will never create duplicate accounts or overwrite existing records.

The required imports at the top of `src/ui/db/initializeAccounts.ts` include:

```typescript
import { getAccount, putAccount } from "./feedDb";
// (adjust path if the module is named socialFeedDb.ts — use the actual filename)
```

`putAccount` is the upsert helper exported from Phase 3's `socialFeedDb.ts`. It must be imported explicitly; do not re-implement the IDB write logic in this file.

**Steps:**

1. Load all journalist and fan `AgentConfig` templates from Phase 2 (`src/data/socialAgents/`). These are the static, non-org, non-player configs.

2. For each journalist/fan template, compute `agentId = template.id`. Call `getAccount(agentId)`. If an account already exists, skip it. Otherwise, create and persist:

   ```typescript
   {
     agentId: template.id,
     handle: template.handle,
     displayName: template.handle,   // journalists/fans: use handle as display name
     type: template.type,
     pid: null,
     tid: null,
     templateId: template.id,
     status: "active",
     avatarUrl: null,
     createdAt: Date.now(),
   }
   ```

3. Load the org `AgentConfig` template from Phase 2. For each `TeamSummary` in `teams`, compute `agentId = "team_${team.tid}"`. Call `getAccount(agentId)`. If it exists, skip. Otherwise, create and persist:

   ```typescript
   {
     agentId: `team_${team.tid}`,
     handle: team.abbrev.toLowerCase(),  // e.g. "lac", "bos"
     displayName: `${team.name} Official`,
     type: "org",
     pid: null,
     tid: team.tid,
     templateId: orgTemplate.id,
     status: "active",
     avatarUrl: null,
     createdAt: Date.now(),
   }
   ```

4. For each `PlayerSummary` in `players` where `player.tid !== -1` (rostered players only), compute `agentId = "player_${player.pid}"`. Call `getAccount(agentId)`. If it exists, skip. Otherwise create and persist:

   ```typescript
   {
     agentId: `player_${player.pid}`,
     handle: player.name.toLowerCase().replace(/\s+/g, "_"),
     displayName: player.name,
     type: "player",
     pid: player.pid,
     tid: player.tid,
     templateId: playerTemplate.id,
     status: "active",
     avatarUrl: null,
     createdAt: Date.now(),
   }
   ```

   Free agents (`tid === -1`) are skipped. They will be picked up by `syncPlayerAccounts` when signed to a team.

5. Return. No return value. Throws on IDB errors.

## `syncPlayerAccounts()` Implementation

Called after every game phase change where player ratings are updated (e.g. after preseason, regular season, playoffs simulate). Receives the current full player list with up-to-date `ovr` values.

**Steps:**

1. Load the player `AgentConfig` template from Phase 2.

2. For each `PlayerSummary` in `players`:

   a. Compute `agentId = "player_${player.pid}"`.

   b. Call `getAccount(agentId)`.

   c. **No existing account + rostered (`tid !== -1`):** Create a new active player account (same structure as in `initializeFeedAccounts` step 4).

   d. **Existing account + rostered + player changed teams:** The player was traded or signed. Update `account.tid` to `player.tid`, set `account.status = "active"`, and call `putAccount(account)`.

   e. **Existing account + rostered + same team:** No changes needed. Skip.

   f. **Existing account + free agent (`tid === -1`):** Player was cut or released. Set `account.status = "dormant"` and call `putAccount(account)`. Do NOT delete the account — historical posts must remain accessible.

   g. **No existing account + free agent (`tid === -1`):** Nothing to do. Skip.

3. Return. No return value. Throws on IDB errors.

## Idempotency Strategy

`initializeFeedAccounts` is safe to call multiple times on the same league (required because the Feed Worker can restart). The guard is a per-account `getAccount` check before any write:

```typescript
const existing = await getAccount(agentId);
if (existing) continue; // already seeded — skip without overwriting
// otherwise: build the Account object and call putAccount(account)
```

`putAccount` (imported from `./feedDb`) is used for all writes — both initial seeding and updates in `syncPlayerAccounts`.

This means:

- The first call seeds all eligible accounts.
- Subsequent calls check every candidate `agentId` and find existing records, so no writes occur.
- Fields on existing accounts (e.g. a player's `tid` updated by a trade) are NOT overwritten by `initializeFeedAccounts`. Trade sync is the exclusive responsibility of `syncPlayerAccounts`.

`syncPlayerAccounts` is similarly safe to call multiple times — it uses the same existence check before creation and only updates fields that have actually changed (`tid` or `status`).

## Implementation Notes

### Phase 2 template loading

Phase 3a reads agent configs produced by Phase 2. Since Phase 2 templates are static JSON files in `src/data/socialAgents/`, import them directly (they are bundled at build time, not fetched at runtime). Example:

```typescript
import journalistConfigs from "../../data/socialAgents/journalists.json";
import fanConfigs from "../../data/socialAgents/fans.json";
import orgTemplate from "../../data/socialAgents/orgTemplate.json";
import playerTemplate from "../../data/socialAgents/playerTemplate.json";
```

If the Phase 2 files are not yet written, stub them with minimal valid `AgentConfig` JSON and update the imports when Phase 2 ships.

### Org account `handle`

Org handles are derived from the team abbreviation lowercased (e.g. `"lac"`, `"bos"`). This mirrors how real team accounts work on social platforms. Since abbreviations are unique per league, there are no collisions.

### Player account `handle`

Player handles are derived from the player's display name: lowercase, spaces replaced with underscores (e.g. `"lebron_james"`). Name collisions are possible in theory. For v1, append `_${pid}` only if a collision is detected at write time. Detecting a collision: attempt to find any account with the same `handle` before creating. If found, use `"${handle}_${pid}"` instead.

### Dormant accounts and historical posts

Dormant accounts retain all their historical `GeneratedPost` records in `socialFeedDb.posts`. The feed UI may choose to show or hide dormant account posts, but the records are never deleted by Phase 3a logic. Dormancy is reversible: if a player's OVR rises above the threshold again in a future `syncPlayerAccounts` call, set `status` back to `"active"`.

### Call site — Feed Worker, not the main thread

`initializeFeedAccounts` is called from the **Feed Worker** (not from a React component or the main thread) during worker initialization. The worker calls it once when it first connects to a league, before processing any queued events. Because the worker can restart without warning, the call must be safe to repeat: the per-account `getAccount` guard ensures no duplicate writes occur.

Pseudocode for the worker initialization sequence:

```typescript
// Inside the Feed Worker startup handler:
await initializeFeedAccounts(teams, players);
// accounts are now seeded — safe to begin event processing
```

The `teams` and `players` snapshots are passed in from the worker's initial message payload (sent by the game Worker or the UI at league load time).

`syncPlayerAccounts` is called from a separate worker message handler — wherever the game Worker signals a phase change with updated player ratings (routed through the Feed Worker's message listener).

### No server, no game-Worker round-trip for account init

Account initialization runs entirely against `socialFeedDb` inside the Feed Worker. It does not call `toWorker()` or touch the league IDB. The `teams` and `players` data passed in must already be available in the Feed Worker at the point `initializeFeedAccounts` is called (delivered via the initialization message from the main thread).

## Verified by

- After `initializeFeedAccounts`, `getAllAccounts()` returns:
  - One account per team (type `"org"`)
  - One account per journalist template (type `"journalist"`)
  - One account per fan archetype template (type `"fan"`)
  - One account per rostered player (`tid !== -1`, type `"player"`)
- A rostered player has a `status: "active"` account after `syncPlayerAccounts` runs
- A player who was cut/released (`tid === -1`) who previously had an account has `status: "dormant"` after `syncPlayerAccounts` runs
- A free agent who never had an account has no account after `syncPlayerAccounts` runs
- Running `initializeFeedAccounts` twice on the same league produces identical account counts — no duplicates
- `getAccountByPid(pid)` resolves correctly for a newly created player account
- `getAccountByTid(tid)` resolves correctly for a team org account
- A traded player's account `tid` reflects the new team after `syncPlayerAccounts` runs
- `tsc --noEmit` on `initializeAccounts.ts` passes with zero errors

## Definition of Done

All non-player accounts seeded on first feed init. Player accounts created for all rostered players (`tid !== -1`), dormanted when cut, reactivated and `tid`-updated when signed/traded. Both functions are idempotent — safe to call multiple times. `getAccountByPid` and `getAccountByTid` resolve correctly for all seeded records. Zero TypeScript errors.
