# Phase 1: Shared Types

## Contract

A single source-of-truth types file exists that defines every data shape used across the feed system. All subsequent phases import from it — none define their own.

## Depends on

Nothing. This is the root phase.

## Delivers

- `src/common/types.feedEvent.ts`

## Types to Define

### `FeedEventType`

```typescript
export type FeedEventType =
	| "GAME_END"
	| "HALFTIME"
	| "TRADE_ALERT"
	| "DRAFT_PICK"
	| "INJURY"
	| "PLAYER_SIGNING"
	| "SEASON_AWARD"
	| "PLAYOFF_CLINCH";
```

### `SocialContext`

```typescript
export type SocialContext = {
	liveGame?: {
		score: [number, number];
		quarter: number;
		statLeaders: StatLeader[];
	};
	teams: TeamSummary[];
	players: PlayerSummary[];
	recentGames: GameResult[];
	standings: StandingEntry[];
	transactions: TransactionSummary[];
};
```

### `FeedEvent`

```typescript
export type FeedEvent = {
	type: FeedEventType;
	timestamp: number;
	context: SocialContext;
};
```

### `Account`

Persistent identity record stored in `socialFeedDb`. One record per agent, keyed by `agentId`. Links back to game entities via `pid` (player) or `tid` (team org).

```typescript
export type Account = {
	agentId: string;
	handle: string;
	displayName: string;
	type: "journalist" | "player" | "org" | "fan";
	pid: number | null; // non-null for player accounts
	tid: number | null; // non-null for org accounts; updated on trade
	templateId: string; // references AgentConfig.id
	status: "active" | "dormant";
	avatarUrl: string | null;
	createdAt: number;
};
```

### `AgentConfig`

```typescript
export type AgentConfig = {
	id: string;
	handle: string;
	type: "journalist" | "player" | "org" | "fan";
	persona: string;
	triggers: FeedEventType[];
	replyEligible: boolean; // always false in v1
	postProbability: number; // 0–1
};
```

### `GeneratedPost`

```typescript
export type GeneratedPost = {
	postId: string;
	agentId: string;
	handle: string;
	body: string;
	eventType: FeedEventType;
	threadId: string | null; // null in v1
	parentId: string | null; // null in v1
	imageUrl: string | null;
	createdAt: number;
	likes: number;
	reposts: number;
};
```

### `ThreadRecord`

```typescript
export type ThreadRecord = {
	threadId: string;
	rootPostId: string;
	openedAt: number;
	expiresAt: number; // openedAt + 5 minutes
	participantAgents: string[];
};
```

### Supporting Types

```typescript
export type StatLeader = {
	playerName: string;
	teamName: string;
	statLabel: string;
	value: number;
};

export type TeamSummary = {
	tid: number;
	name: string;
	abbrev: string;
	wins: number;
	losses: number;
	standing: number;
};

export type PlayerSummary = {
	pid: number;
	name: string;
	tid: number;
	teamName: string;
	position: string;
	seasonAverages: {
		pts: number;
		reb: number;
		ast: number;
	};
};

export type GameResult = {
	gid: number;
	homeName: string;
	awayName: string;
	homeScore: number;
	awayScore: number;
	date: string;
};

export type StandingEntry = {
	tid: number;
	name: string;
	abbrev: string;
	wins: number;
	losses: number;
	pct: number;
	conf: string;
};

export type TransactionSummary = {
	type: "trade" | "signing" | "release" | "injury";
	description: string;
	timestamp: number;
};
```

## Implementation Notes

- This file lives in `src/common/` — it is imported by both `src/worker/` and `src/ui/` code
- No runtime logic, no imports — pure type definitions only
- All nullable fields use `T | null`, never `T | undefined`. This matters for IndexedDB serialization
- `replyEligible` and threading fields (`threadId`, `parentId`) are typed and present but unused in v1 — they exist so v2 requires no type migration

## Verified by

- `tsc --noEmit` on `types.feedEvent.ts` passes with zero errors
- No `any` appears anywhere in the file
- `FeedEventType` is a union of exactly 8 string literals
- Every field in `GeneratedPost` that can be absent is typed as `T | null`, not optional (`?`)
- Every field in `Account` that can be absent is typed as `T | null`, not optional (`?`)
- `Account.pid` and `Account.tid` are `number | null` (not optional) for IDB serialization
- The file has zero imports

## Definition of Done

One file. Zero imports. Zero `any`. Compiles clean. All 8 event types present. Every subsequent phase can import from this file on day one.
