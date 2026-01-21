/**
 * Cloud sync types for Firebase Firestore integration
 *
 * This defines the schema for cloud-synced leagues that enable
 * real-time multi-device synchronization.
 */

// Store type duplicated here to avoid circular dependency with Cache.ts
// Keep in sync with src/worker/db/Cache.ts
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
	// Unique cloud league ID (Firestore document ID)
	cloudId: string;

	// Display name for the league
	name: string;

	// Sport type
	sport: "basketball" | "football" | "baseball" | "hockey";

	// Owner's Firebase UID
	ownerId: string;

	// Users who have access to this league (including owner)
	members: string[];

	// Creation timestamp
	createdAt: number;

	// Last modified timestamp (for conflict detection)
	updatedAt: number;

	// Current season (for quick display)
	season: number;

	// Current phase
	phase: number;

	// Team user controls
	userTid: number;

	// Version for migration compatibility
	schemaVersion: number;
};

// Sync status for a cloud league
export type CloudSyncStatus =
	| "disconnected"    // Not connected to cloud
	| "connecting"      // Establishing connection
	| "syncing"         // Actively syncing changes
	| "synced"          // All changes synced
	| "conflict"        // Conflict detected
	| "error";          // Error occurred

// Lock state for preventing concurrent simulations
export type CloudLock = {
	// Device ID that holds the lock
	deviceId: string;

	// User ID that holds the lock
	userId: string;

	// Lock acquisition time
	acquiredAt: number;

	// Lock expiration time (auto-release after this)
	expiresAt: number;

	// What operation is locked
	operation: "sim" | "draft" | "trade" | "freeAgency" | "newPhase";
};

// Change record for tracking what needs to sync
export type CloudChange = {
	store: Store;
	id: string | number;
	operation: "put" | "delete";
	timestamp: number;
	data?: any;
};

// Batch of changes to sync
export type CloudChangeBatch = {
	changes: CloudChange[];
	timestamp: number;
	deviceId: string;
	userId: string;
};

// Configuration for what to sync in real-time vs on-demand
export type CloudSyncConfig = {
	// Stores that sync in real-time (small, frequently accessed)
	realtime: Store[];

	// Stores that sync on-demand (large, less frequently accessed)
	onDemand: Store[];

	// Stores that don't sync (local only)
	localOnly: Store[];
};

// Default sync configuration
export const DEFAULT_SYNC_CONFIG: CloudSyncConfig = {
	// Real-time sync for core game state
	realtime: [
		"gameAttributes",
		"players",
		"teams",
		"teamSeasons",
		"teamStats",
		"schedule",
		"playoffSeries",
		"draftPicks",
		"negotiations",
		"trade",
		"allStars",
		"headToHeads",
		"releasedPlayers",
		"savedTrades",
		"savedTradingBlock",
	],

	// On-demand sync for historical/large data
	onDemand: [
		"games",           // Box scores - can be large
		"events",          // Event log - grows over time
		"messages",        // In-game messages
		"awards",          // End of season awards
		"draftLotteryResults",
		"playerFeats",     // Notable performances
		"scheduledEvents",
		"seasonLeaders",
	],

	// Never sync (local UI state)
	localOnly: [],
};

// Firestore document paths
export const CLOUD_PATHS = {
	// User's league list
	userLeagues: (userId: string) => `users/${userId}/leagues`,

	// League metadata
	leagueMeta: (cloudId: string) => `leagues/${cloudId}`,

	// League data collections
	leagueStore: (cloudId: string, store: Store) => `leagues/${cloudId}/${store}`,

	// League lock
	leagueLock: (cloudId: string) => `leagues/${cloudId}/meta/lock`,

	// Sync state
	syncState: (cloudId: string) => `leagues/${cloudId}/meta/syncState`,
};

// Local storage keys for cloud state
export const CLOUD_STORAGE_KEYS = {
	// Current user's Firebase UID
	userId: "cloudUserId",

	// Device ID (persistent across sessions)
	deviceId: "cloudDeviceId",

	// Mapping of local league IDs to cloud IDs
	leagueMapping: "cloudLeagueMapping",

	// Pending changes queue (for offline support)
	pendingChanges: "cloudPendingChanges",
};

// Get or create a persistent device ID
export const getDeviceId = (): string => {
	if (typeof localStorage === "undefined") {
		// Worker context - use a generated ID
		return `worker-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	}

	let deviceId = localStorage.getItem(CLOUD_STORAGE_KEYS.deviceId);
	if (!deviceId) {
		deviceId = `device-${Date.now()}-${Math.random().toString(36).slice(2)}`;
		localStorage.setItem(CLOUD_STORAGE_KEYS.deviceId, deviceId);
	}
	return deviceId;
};

// Mapping between local league ID and cloud ID
export type LeagueCloudMapping = {
	[localLid: number]: string; // cloudId
};

// Get cloud ID for a local league
export const getCloudIdForLeague = (lid: number): string | undefined => {
	if (typeof localStorage === "undefined") {
		return undefined;
	}

	const mappingStr = localStorage.getItem(CLOUD_STORAGE_KEYS.leagueMapping);
	if (!mappingStr) {
		return undefined;
	}

	try {
		const mapping: LeagueCloudMapping = JSON.parse(mappingStr);
		return mapping[lid];
	} catch {
		return undefined;
	}
};

// Set cloud ID for a local league
export const setCloudIdForLeague = (lid: number, cloudId: string): void => {
	if (typeof localStorage === "undefined") {
		return;
	}

	let mapping: LeagueCloudMapping = {};
	const mappingStr = localStorage.getItem(CLOUD_STORAGE_KEYS.leagueMapping);
	if (mappingStr) {
		try {
			mapping = JSON.parse(mappingStr);
		} catch {
			// Ignore parse errors
		}
	}

	mapping[lid] = cloudId;
	localStorage.setItem(CLOUD_STORAGE_KEYS.leagueMapping, JSON.stringify(mapping));
};

// Remove cloud mapping for a local league
export const removeCloudIdForLeague = (lid: number): void => {
	if (typeof localStorage === "undefined") {
		return;
	}

	const mappingStr = localStorage.getItem(CLOUD_STORAGE_KEYS.leagueMapping);
	if (!mappingStr) {
		return;
	}

	try {
		const mapping: LeagueCloudMapping = JSON.parse(mappingStr);
		delete mapping[lid];
		localStorage.setItem(CLOUD_STORAGE_KEYS.leagueMapping, JSON.stringify(mapping));
	} catch {
		// Ignore parse errors
	}
};
