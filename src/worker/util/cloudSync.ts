/**
 * Cloud Sync Layer for Firestore
 *
 * This module handles real-time synchronization between the local IndexedDB
 * cache and Firebase Firestore, enabling multi-device live updates.
 */

import { initializeApp, type FirebaseApp } from "firebase/app";
import {
	getFirestore,
	collection,
	doc,
	getDoc,
	getDocs,
	setDoc,
	deleteDoc,
	writeBatch,
	onSnapshot,
	query,
	where,
	serverTimestamp,
	type Firestore,
	type Unsubscribe,
	type DocumentData,
} from "firebase/firestore";
import type { Store } from "../db/Cache.ts";
import {
	type CloudLeague,
	type CloudLock,
	type CloudSyncStatus,
	DEFAULT_SYNC_CONFIG,
	CLOUD_PATHS,
	getDeviceId,
} from "../../common/cloudTypes.ts";
import toUI from "./toUI.ts";

// Firebase configuration - must match UI config
const firebaseConfig = {
	apiKey: "YOUR_API_KEY",
	authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
	projectId: "YOUR_PROJECT_ID",
	storageBucket: "YOUR_PROJECT_ID.firebasestorage.app",
	messagingSenderId: "YOUR_SENDER_ID",
	appId: "YOUR_APP_ID",
};

// Check if Firebase is configured
const isFirebaseConfigured = (): boolean => {
	return firebaseConfig.apiKey !== "YOUR_API_KEY" &&
		firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

// Singleton instances
let app: FirebaseApp | null = null;
let db: Firestore | null = null;

// Current sync state
let currentCloudId: string | null = null;
let currentUserId: string | null = null;
let syncStatus: CloudSyncStatus = "disconnected";
const listeners: Map<string, Unsubscribe> = new Map();
let isSyncing = false;
const deviceId: string = getDeviceId();

// Lock state
let currentLock: CloudLock | null = null;
let lockRefreshInterval: ReturnType<typeof setInterval> | null = null;

// Batch write settings
const BATCH_SIZE = 500; // Firestore limit

// Initialize Firestore for worker
const initFirestore = (): Firestore => {
	if (!isFirebaseConfigured()) {
		throw new Error("Firebase not configured");
	}

	if (!app) {
		app = initializeApp(firebaseConfig, "worker");
		db = getFirestore(app);
	}

	return db!;
};

// Get Firestore instance
export const getDb = (): Firestore | null => {
	if (!db && isFirebaseConfigured()) {
		try {
			return initFirestore();
		} catch {
			return null;
		}
	}
	return db;
};

// Update sync status and notify UI
const setSyncStatus = (status: CloudSyncStatus) => {
	syncStatus = status;
	toUI("updateLocal", [{ cloudSyncStatus: status }]);
};

// Get document ID for a record (handles different primary key types)
const getDocId = (store: Store, record: any): string => {
	const pkMap: Record<Store, string> = {
		allStars: "season",
		awards: "season",
		draftLotteryResults: "season",
		draftPicks: "dpid",
		events: "eid",
		gameAttributes: "key",
		games: "gid",
		headToHeads: "season",
		messages: "mid",
		negotiations: "pid",
		playerFeats: "fid",
		players: "pid",
		playoffSeries: "season",
		releasedPlayers: "rid",
		savedTrades: "hash",
		savedTradingBlock: "rid",
		schedule: "gid",
		scheduledEvents: "id",
		seasonLeaders: "season",
		teamSeasons: "rid",
		teamStats: "rid",
		teams: "tid",
		trade: "rid",
	};

	const pk = pkMap[store];
	const id = record[pk];

	return String(id);
};

/**
 * Connect to a cloud league and start syncing
 */
export const connectToCloud = async (
	cloudId: string,
	userId: string,
): Promise<boolean> => {
	const firestore = getDb();
	if (!firestore) {
		console.error("Firestore not available");
		return false;
	}

	// Disconnect from any existing cloud league
	if (currentCloudId) {
		await disconnectFromCloud();
	}

	currentCloudId = cloudId;
	currentUserId = userId;
	setSyncStatus("connecting");

	try {
		// Verify league exists and user has access
		const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(cloudId));
		const leagueDoc = await getDoc(leagueRef);

		if (!leagueDoc.exists()) {
			throw new Error("Cloud league not found");
		}

		const leagueData = leagueDoc.data() as CloudLeague;
		if (!leagueData.members.includes(userId)) {
			throw new Error("You don't have access to this league");
		}

		// Start real-time listeners for configured stores
		await startRealtimeListeners(cloudId);

		setSyncStatus("synced");
		return true;
	} catch (error) {
		console.error("Failed to connect to cloud:", error);
		setSyncStatus("error");
		currentCloudId = null;
		currentUserId = null;
		return false;
	}
};

/**
 * Disconnect from cloud league
 */
export const disconnectFromCloud = async (): Promise<void> => {
	// Stop all listeners
	for (const unsubscribe of listeners.values()) {
		unsubscribe();
	}
	listeners.clear();

	// Release any held lock
	await releaseLock();

	// Clear state
	currentCloudId = null;
	currentUserId = null;

	setSyncStatus("disconnected");
};

/**
 * Start real-time listeners for all configured stores
 */
const startRealtimeListeners = async (cloudId: string): Promise<void> => {
	const firestore = getDb();
	if (!firestore) return;

	for (const store of DEFAULT_SYNC_CONFIG.realtime) {
		const collectionPath = CLOUD_PATHS.leagueStore(cloudId, store);
		const collectionRef = collection(firestore, collectionPath);

		const unsubscribe = onSnapshot(
			collectionRef,
			(snapshot) => {
				// Don't process our own changes
				if (isSyncing) return;

				const changes: Array<{ type: "added" | "modified" | "removed"; doc: DocumentData; id: string }> = [];

				snapshot.docChanges().forEach((change) => {
					changes.push({
						type: change.type,
						doc: change.doc.data(),
						id: change.doc.id,
					});
				});

				if (changes.length > 0) {
					handleRemoteChanges(store, changes);
				}
			},
			(error) => {
				console.error(`Listener error for ${store}:`, error);
				setSyncStatus("error");
			}
		);

		listeners.set(store, unsubscribe);
	}

	// Also listen for lock changes
	const lockRef = doc(firestore, CLOUD_PATHS.leagueLock(cloudId));
	const lockUnsubscribe = onSnapshot(lockRef, (snapshot) => {
		if (snapshot.exists()) {
			const lockData = snapshot.data() as CloudLock;
			// Notify UI if another device acquired the lock
			if (lockData.deviceId !== deviceId) {
				toUI("updateLocal", [{
					cloudLockHolder: lockData.userId,
					cloudLockOperation: lockData.operation,
				}]);
			}
		} else {
			toUI("updateLocal", [{
				cloudLockHolder: null,
				cloudLockOperation: null,
			}]);
		}
	});
	listeners.set("_lock", lockUnsubscribe);
};

/**
 * Handle changes received from Firestore (other devices)
 */
const handleRemoteChanges = async (
	store: Store,
	changes: Array<{ type: "added" | "modified" | "removed"; doc: DocumentData; id: string }>
): Promise<void> => {
	// Import cache dynamically to avoid circular dependency
	const { idb } = await import("../db/index.ts");

	for (const change of changes) {
		try {
			const cacheStore = (idb.cache as any)[store];
			if (change.type === "removed") {
				// Delete from local cache
				const id = isNaN(Number(change.id)) ? change.id : Number(change.id);
				await cacheStore.delete(id);
			} else {
				// Add or update in local cache
				const record = change.doc;
				// Remove Firestore metadata fields
				delete record._cloudUpdatedAt;
				delete record._cloudDeviceId;

				await cacheStore.put(record);
			}
		} catch (error) {
			console.error(`Failed to apply remote change to ${store}:`, error);
		}
	}

	// Trigger UI refresh
	const updateEvents = getUpdateEventsForStore(store);
	if (updateEvents.length > 0) {
		toUI("realtimeUpdate", [updateEvents as any]);
	}
};

/**
 * Map store to update events for UI refresh
 */
const getUpdateEventsForStore = (store: Store): string[] => {
	const mapping: Partial<Record<Store, string[]>> = {
		players: ["playerMovement", "gameSim"],
		teams: ["team"],
		teamSeasons: ["team", "gameSim"],
		teamStats: ["team", "gameSim"],
		schedule: ["gameSim"],
		playoffSeries: ["playoffs"],
		draftPicks: ["playerMovement"],
		negotiations: ["playerMovement"],
		trade: ["playerMovement"],
		gameAttributes: ["gameAttributes"],
		games: ["gameSim"],
		allStars: ["allStarDunk", "allStarThree"],
		headToHeads: ["gameSim"],
		releasedPlayers: ["playerMovement"],
		savedTrades: ["playerMovement"],
		savedTradingBlock: ["playerMovement"],
		awards: ["gameSim"],
		draftLotteryResults: ["gameSim"],
		events: ["gameSim"],
		messages: ["gameSim"],
		playerFeats: ["gameSim"],
		scheduledEvents: ["scheduledEvents"],
		seasonLeaders: ["gameSim"],
	};

	return mapping[store] || ["gameSim"];
};

/**
 * Sync local changes to Firestore
 */
export const syncChangesToCloud = async (
	store: Store,
	records: any[],
	deletedIds: (string | number)[],
): Promise<void> => {
	const firestore = getDb();
	if (!firestore || !currentCloudId) return;

	// Skip if not a synced store
	if (!DEFAULT_SYNC_CONFIG.realtime.includes(store) &&
		!DEFAULT_SYNC_CONFIG.onDemand.includes(store)) {
		return;
	}

	isSyncing = true;
	setSyncStatus("syncing");

	try {
		const collectionPath = CLOUD_PATHS.leagueStore(currentCloudId, store);

		// Process in batches
		const allOperations: Array<{ type: "set" | "delete"; id: string; data?: any }> = [];

		// Add updates
		for (const record of records) {
			const docId = getDocId(store, record);
			allOperations.push({
				type: "set",
				id: docId,
				data: {
					...record,
					_cloudUpdatedAt: serverTimestamp(),
					_cloudDeviceId: deviceId,
				},
			});
		}

		// Add deletes
		for (const id of deletedIds) {
			allOperations.push({
				type: "delete",
				id: String(id),
			});
		}

		// Execute in batches
		for (let i = 0; i < allOperations.length; i += BATCH_SIZE) {
			const batch = writeBatch(firestore);
			const batchOps = allOperations.slice(i, i + BATCH_SIZE);

			for (const op of batchOps) {
				const docRef = doc(firestore, collectionPath, op.id);
				if (op.type === "set") {
					batch.set(docRef, op.data, { merge: true });
				} else {
					batch.delete(docRef);
				}
			}

			await batch.commit();
		}

		setSyncStatus("synced");
	} catch (error) {
		console.error(`Failed to sync ${store} to cloud:`, error);
		setSyncStatus("error");
		throw error;
	} finally {
		isSyncing = false;
	}
};

/**
 * Load all data for a store from Firestore
 */
export const loadStoreFromCloud = async (
	store: Store,
): Promise<any[]> => {
	const firestore = getDb();
	if (!firestore || !currentCloudId) return [];

	try {
		const collectionPath = CLOUD_PATHS.leagueStore(currentCloudId, store);
		const collectionRef = collection(firestore, collectionPath);
		const snapshot = await getDocs(collectionRef);

		const records: any[] = [];
		snapshot.forEach((doc) => {
			const data = doc.data();
			// Remove Firestore metadata
			delete data._cloudUpdatedAt;
			delete data._cloudDeviceId;
			records.push(data);
		});

		return records;
	} catch (error) {
		console.error(`Failed to load ${store} from cloud:`, error);
		return [];
	}
};

/**
 * Create a new cloud league from local data
 */
export const createCloudLeague = async (
	name: string,
	sport: "basketball" | "football" | "baseball" | "hockey",
	userId: string,
): Promise<string> => {
	const firestore = getDb();
	if (!firestore) {
		throw new Error("Firestore not available");
	}

	// Generate a new cloud ID
	const cloudId = `league-${Date.now()}-${Math.random().toString(36).slice(2)}`;

	const leagueData: CloudLeague = {
		cloudId,
		name,
		sport,
		ownerId: userId,
		members: [userId],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		season: 0,
		phase: 0,
		userTid: 0,
		schemaVersion: 1,
	};

	// Create the league document
	const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(cloudId));
	await setDoc(leagueRef, leagueData);

	return cloudId;
};

/**
 * Upload entire local league to cloud
 */
export const uploadLeagueToCloud = async (
	cloudId: string,
	getAllData: () => Promise<Record<Store, any[]>>,
	onProgress?: (store: Store, current: number, total: number) => void,
): Promise<void> => {
	const firestore = getDb();
	if (!firestore) {
		throw new Error("Firestore not available");
	}

	setSyncStatus("syncing");

	try {
		const allData = await getAllData();
		const stores = Object.keys(allData) as Store[];
		const totalStores = stores.length;

		for (let i = 0; i < stores.length; i++) {
			const store = stores[i]!;
			const records = allData[store] || [];

			if (onProgress) {
				onProgress(store, i + 1, totalStores);
			}

			if (records.length === 0) continue;

			const collectionPath = CLOUD_PATHS.leagueStore(cloudId, store);

			// Upload in batches
			for (let j = 0; j < records.length; j += BATCH_SIZE) {
				const batch = writeBatch(firestore);
				const batchRecords = records.slice(j, j + BATCH_SIZE);

				for (const record of batchRecords) {
					const docId = getDocId(store, record);
					const docRef = doc(firestore, collectionPath, docId);
					batch.set(docRef, {
						...record,
						_cloudUpdatedAt: serverTimestamp(),
						_cloudDeviceId: deviceId,
					});
				}

				await batch.commit();
			}
		}

		setSyncStatus("synced");
	} catch (error) {
		setSyncStatus("error");
		throw error;
	}
};

/**
 * Acquire a lock for an operation (prevents concurrent sims)
 */
export const acquireLock = async (
	operation: CloudLock["operation"],
	timeoutMs: number = 60000, // 1 minute default
): Promise<boolean> => {
	const firestore = getDb();
	if (!firestore || !currentCloudId || !currentUserId) {
		return true; // Allow operation if not connected to cloud
	}

	const lockRef = doc(firestore, CLOUD_PATHS.leagueLock(currentCloudId));

	try {
		// Check if lock exists and is still valid
		const lockDoc = await getDoc(lockRef);

		if (lockDoc.exists()) {
			const existingLock = lockDoc.data() as CloudLock;

			// Check if lock is expired
			if (existingLock.expiresAt > Date.now()) {
				// Lock is still valid
				if (existingLock.deviceId !== deviceId) {
					// Another device has the lock
					return false;
				}
				// We already have the lock, refresh it
			}
		}

		// Acquire/refresh the lock
		const now = Date.now();
		currentLock = {
			deviceId,
			userId: currentUserId,
			acquiredAt: now,
			expiresAt: now + timeoutMs,
			operation,
		};

		await setDoc(lockRef, currentLock);

		// Set up auto-refresh
		if (lockRefreshInterval) {
			clearInterval(lockRefreshInterval);
		}
		lockRefreshInterval = setInterval(async () => {
			if (currentLock) {
				currentLock.expiresAt = Date.now() + timeoutMs;
				await setDoc(lockRef, currentLock);
			}
		}, timeoutMs / 2);

		return true;
	} catch (error) {
		console.error("Failed to acquire lock:", error);
		return false;
	}
};

/**
 * Release the current lock
 */
export const releaseLock = async (): Promise<void> => {
	if (lockRefreshInterval) {
		clearInterval(lockRefreshInterval);
		lockRefreshInterval = null;
	}

	const firestore = getDb();
	if (!firestore || !currentCloudId || !currentLock) {
		currentLock = null;
		return;
	}

	try {
		const lockRef = doc(firestore, CLOUD_PATHS.leagueLock(currentCloudId));
		await deleteDoc(lockRef);
	} catch (error) {
		console.error("Failed to release lock:", error);
	}

	currentLock = null;
};

/**
 * Check if we have an active lock
 */
export const hasLock = (): boolean => {
	return currentLock !== null && currentLock.expiresAt > Date.now();
};

/**
 * Get current sync status
 */
export const getSyncStatus = (): CloudSyncStatus => {
	return syncStatus;
};

/**
 * Check if connected to cloud
 */
export const isConnectedToCloud = (): boolean => {
	return currentCloudId !== null && syncStatus !== "disconnected" && syncStatus !== "error";
};

/**
 * Get current cloud ID
 */
export const getCurrentCloudId = (): string | null => {
	return currentCloudId;
};

/**
 * Update league metadata in cloud
 */
export const updateCloudLeagueMeta = async (
	updates: Partial<CloudLeague>,
): Promise<void> => {
	const firestore = getDb();
	if (!firestore || !currentCloudId) return;

	try {
		const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(currentCloudId));
		await setDoc(leagueRef, {
			...updates,
			updatedAt: Date.now(),
		}, { merge: true });
	} catch (error) {
		console.error("Failed to update league metadata:", error);
	}
};

/**
 * Get list of cloud leagues user has access to
 */
export const getCloudLeagues = async (userId: string): Promise<CloudLeague[]> => {
	const firestore = getDb();
	if (!firestore) return [];

	try {
		const leaguesRef = collection(firestore, "leagues");
		const q = query(leaguesRef, where("members", "array-contains", userId));
		const snapshot = await getDocs(q);

		const leagues: CloudLeague[] = [];
		snapshot.forEach((doc) => {
			leagues.push(doc.data() as CloudLeague);
		});

		return leagues.sort((a, b) => b.updatedAt - a.updatedAt);
	} catch (error) {
		console.error("Failed to get cloud leagues:", error);
		return [];
	}
};

/**
 * Delete a cloud league (owner only)
 */
export const deleteCloudLeague = async (
	cloudId: string,
	userId: string,
): Promise<boolean> => {
	const firestore = getDb();
	if (!firestore) return false;

	try {
		// Verify ownership
		const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(cloudId));
		const leagueDoc = await getDoc(leagueRef);

		if (!leagueDoc.exists()) {
			return false;
		}

		const leagueData = leagueDoc.data() as CloudLeague;
		if (leagueData.ownerId !== userId) {
			throw new Error("Only the owner can delete a cloud league");
		}

		// Delete all collections (this is simplified - in production you'd need
		// a Cloud Function to recursively delete subcollections)
		await deleteDoc(leagueRef);

		return true;
	} catch (error) {
		console.error("Failed to delete cloud league:", error);
		return false;
	}
};
