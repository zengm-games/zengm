/**
 * Cloud sync types for Firebase Firestore integration
 */

// Store type - matches IndexedDB stores
export type Store =
	| "allStars"
	| "awards"
	| "draftLotteryResults"
	| "draftPicks"
	| "events"
	| "gameAttributes"
	| "games"
	| "headToHeads"
	| "messages"
	| "negotiations"
	| "playerFeats"
	| "players"
	| "playoffSeries"
	| "releasedPlayers"
	| "savedTrades"
	| "savedTradingBlock"
	| "schedule"
	| "scheduledEvents"
	| "seasonLeaders"
	| "teamSeasons"
	| "teamStats"
	| "teams"
	| "trade";

// Cloud league metadata stored in Firestore
export type CloudLeague = {
	cloudId: string;
	name: string;
	sport: "basketball" | "football" | "baseball" | "hockey";
	ownerId: string;
	members: CloudMember[];
	createdAt: number;
	updatedAt: number;
	season: number;
	phase: number;
	schemaVersion: number;
};

// Member of a cloud league
export type CloudMember = {
	userId: string;
	displayName: string;
	email?: string;
	teamId: number; // The team this user controls
	role: "commissioner" | "member";
	joinedAt: number;
};

// Sync status
export type CloudSyncStatus =
	| "disconnected"
	| "connecting"
	| "syncing"
	| "synced"
	| "error";
