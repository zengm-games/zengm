/**
 * Cloud Sync Layer for Firestore
 *
 * This module handles real-time synchronization between the local IndexedDB
 * cache and Firebase Firestore, enabling multi-device live updates.
 *
 * IMPORTANT: Firebase is loaded dynamically to avoid breaking the SharedWorker
 * on initial load (Firebase SDK requires browser APIs).
 */

import {
	type Store,
	type CloudLeague,
	type CloudLock,
	type CloudSyncStatus,
	DEFAULT_SYNC_CONFIG,
	CLOUD_PATHS,
	getDeviceId,
} from "../../common/cloudTypes.ts";
import toUI from "./toUI.ts";
import { g } from "./index.ts";

// Firebase configuration - must match UI config
const firebaseConfig = {
	apiKey: "AIzaSyBgfN6pDk6kwDl1lcGEMCkQdN1HUqJ8fnw",
	authDomain: "bbgm-2fb86.firebaseapp.com",
	projectId: "bbgm-2fb86",
	storageBucket: "bbgm-2fb86.firebasestorage.app",
	messagingSenderId: "631082495567",
	appId: "1:631082495567:web:3150c71b2cf84bc0d5443a",
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
	return firebaseConfig.apiKey !== "YOUR_API_KEY" &&
		firebaseConfig.projectId !== "YOUR_PROJECT_ID";
};

// Lazy-loaded Firebase instances
let firebaseApp: any = null;
let firestoreDb: any = null;
let firebaseLoaded = false;

// Firebase module references (loaded dynamically)
let firebaseAppModule: any = null;
let firestoreModule: any = null;

// Current sync state
let currentCloudId: string | null = null;
let currentUserId: string | null = null;
let syncStatus: CloudSyncStatus = "disconnected";
const listeners: Map<string, () => void> = new Map();
let isSyncing = false;
const deviceId: string = getDeviceId();

// Lock state
let currentLock: CloudLock | null = null;
let lockRefreshInterval: ReturnType<typeof setInterval> | null = null;

// Batch write settings
// Firestore allows 500 ops per batch, but HTTP payload limit is ~10MB
// Use smaller batches to avoid payload size errors with large records (games, players)
const BATCH_SIZE = 50;
const MAX_PAYLOAD_SIZE = 8 * 1024 * 1024; // 8MB safety margin

/**
 * Recursively remove undefined values from an object.
 * Firestore doesn't accept undefined values.
 */
const removeUndefinedValues = (obj: any): any => {
	if (obj === null || obj === undefined) {
		return null;
	}
	if (Array.isArray(obj)) {
		return obj.map(removeUndefinedValues);
	}
	if (typeof obj === "object" && obj !== null) {
		const cleaned: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value !== undefined) {
				cleaned[key] = removeUndefinedValues(value);
			}
		}
		return cleaned;
	}
	return obj;
};

/**
 * Dynamically load Firebase modules
 */
const loadFirebase = async (): Promise<boolean> => {
	if (firebaseLoaded) return true;
	if (!isFirebaseConfigured()) return false;

	try {
		// Dynamic imports - only loads when called
		firebaseAppModule = await import("firebase/app");
		firestoreModule = await import("firebase/firestore");
		firebaseLoaded = true;
		return true;
	} catch (error) {
		console.error("Failed to load Firebase:", error);
		return false;
	}
};

/**
 * Initialize Firestore (call after loadFirebase)
 */
const initFirestore = async (): Promise<any> => {
	if (!firebaseLoaded) {
		const loaded = await loadFirebase();
		if (!loaded) throw new Error("Firebase not configured or failed to load");
	}

	if (!firebaseApp) {
		firebaseApp = firebaseAppModule.initializeApp(firebaseConfig, "worker");
		firestoreDb = firestoreModule.getFirestore(firebaseApp);
	}

	return firestoreDb;
};

/**
 * Get Firestore instance (lazy-loading)
 */
export const getDb = async (): Promise<any | null> => {
	if (!isFirebaseConfigured()) return null;

	try {
		if (!firestoreDb) {
			return await initFirestore();
		}
		return firestoreDb;
	} catch {
		return null;
	}
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
	console.log("[CloudSync] connectToCloud started", { cloudId, userId });
	const startTime = performance.now();

	const firestore = await getDb();
	if (!firestore) {
		console.error("[CloudSync] connectToCloud: Firestore not available");
		return false;
	}

	// Disconnect from any existing cloud league
	if (currentCloudId) {
		console.log("[CloudSync] Disconnecting from existing cloud league:", currentCloudId);
		await disconnectFromCloud();
	}

	currentCloudId = cloudId;
	currentUserId = userId;
	setSyncStatus("connecting");

	try {
		// Verify league exists and user has access
		console.log("[CloudSync] Verifying league access...");
		const { doc, getDoc } = firestoreModule;
		const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(cloudId));
		const leagueDoc = await getDoc(leagueRef);

		if (!leagueDoc.exists()) {
			console.error("[CloudSync] League not found:", cloudId);
			throw new Error("Cloud league not found");
		}

		const leagueData = leagueDoc.data() as CloudLeague;
		if (!leagueData.members.includes(userId)) {
			console.error("[CloudSync] User not a member:", { userId, members: leagueData.members });
			throw new Error("You don't have access to this league");
		}

		console.log("[CloudSync] Access verified, starting real-time listeners...");
		// Start real-time listeners for configured stores
		await startRealtimeListeners(cloudId);

		const duration = performance.now() - startTime;
		console.log(`[CloudSync] connectToCloud completed in ${duration.toFixed(0)}ms`);
		setSyncStatus("synced");
		return true;
	} catch (error) {
		console.error("[CloudSync] Failed to connect to cloud:", error);
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
	const firestore = await getDb();
	if (!firestore) return;

	const { collection, doc, onSnapshot } = firestoreModule;

	for (const store of DEFAULT_SYNC_CONFIG.realtime) {
		const collectionPath = CLOUD_PATHS.leagueStore(cloudId, store);
		const collectionRef = collection(firestore, collectionPath);

		const unsubscribe = onSnapshot(
			collectionRef,
			(snapshot: any) => {
				// Don't process while we're syncing to avoid race conditions
				if (isSyncing) return;

				const changes: Array<{ type: "added" | "modified" | "removed"; doc: any; id: string }> = [];

				snapshot.docChanges().forEach((change: any) => {
					const data = change.doc.data();
					// Skip changes from our own device
					if (data._cloudDeviceId === deviceId) {
						return;
					}
					changes.push({
						type: change.type,
						doc: data,
						id: change.doc.id,
					});
				});

				if (changes.length > 0) {
					handleRemoteChanges(store, changes);
				}
			},
			(error: any) => {
				console.error(`Listener error for ${store}:`, error);
				setSyncStatus("error");
			}
		);

		listeners.set(store, unsubscribe);
	}

	// Also listen for lock changes
	const lockRef = doc(firestore, CLOUD_PATHS.leagueLock(cloudId));
	const lockUnsubscribe = onSnapshot(lockRef, (snapshot: any) => {
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
	changes: Array<{ type: "added" | "modified" | "removed"; doc: any; id: string }>
): Promise<void> => {
	console.log(`[CloudSync] handleRemoteChanges: ${store} - ${changes.length} changes received`);
	const startTime = performance.now();

	// Import cache dynamically to avoid circular dependency
	const { idb } = await import("../db/index.ts");

	if (!idb.cache) {
		console.warn("[CloudSync] Cache not available for remote changes");
		return;
	}

	let appliedChanges = 0;
	const gameAttributeUpdates: Array<{ key: string; value: any }> = [];

	for (const change of changes) {
		try {
			if (change.type === "removed") {
				// Delete from local cache using remote method (won't mark as dirty)
				const id = isNaN(Number(change.id)) ? change.id : Number(change.id);
				await idb.cache._deleteFromRemote(store, id);
				appliedChanges++;
			} else {
				// Add or update in local cache using remote method (won't mark as dirty)
				const record = change.doc;
				// Remove Firestore metadata fields
				delete record._cloudUpdatedAt;
				delete record._cloudDeviceId;

				await idb.cache._putFromRemote(store, record);
				appliedChanges++;

				// Track gameAttributes changes to update the g object
				if (store === "gameAttributes" && record.key && record.value !== undefined) {
					gameAttributeUpdates.push({ key: record.key, value: record.value });
				}
			}
		} catch (error) {
			console.error(`Failed to apply remote change to ${store}:`, error);
		}
	}

	// Update the g object with any gameAttributes changes
	// This is critical - the g object is what views actually read from
	if (gameAttributeUpdates.length > 0) {
		for (const { key, value } of gameAttributeUpdates) {
			try {
				g.setWithoutSavingToDB(key as any, value);
			} catch (error) {
				console.error(`Failed to update g.${key}:`, error);
			}
		}
		// Also update UI with the new game attributes
		const gameAttributesObj: Record<string, any> = {};
		for (const { key, value } of gameAttributeUpdates) {
			gameAttributesObj[key] = value;
		}
		toUI("setGameAttributes", [gameAttributesObj, undefined]);
	}

	// Trigger UI refresh and show notification
	if (appliedChanges > 0) {
		// For gameAttributes, we need a comprehensive refresh since these affect everything
		if (store === "gameAttributes") {
			// Trigger a full refresh of most views
			toUI("realtimeUpdate", [["firstRun", "gameSim", "playerMovement", "team", "gameAttributes"] as any]);
		} else {
			const updateEvents = getUpdateEventsForStore(store);
			if (updateEvents.length > 0) {
				toUI("realtimeUpdate", [updateEvents as any]);
			}
		}

		// Create a more descriptive notification
		let notificationText = `Cloud sync: ${appliedChanges} ${store} update${appliedChanges > 1 ? "s" : ""} received`;
		if (store === "gameAttributes" && gameAttributeUpdates.length > 0) {
			const phaseUpdate = gameAttributeUpdates.find(u => u.key === "phase");
			const seasonUpdate = gameAttributeUpdates.find(u => u.key === "season");
			if (phaseUpdate || seasonUpdate) {
				notificationText = "Cloud sync: Game state updated from another device";
			}
		}

		// Notify user about the sync
		toUI("showEvent", [{
			type: "info",
			text: notificationText,
			saveToDb: false,
			showNotification: true,
			persistent: false,
		}]);

		// Update the cloud sync status in UI
		toUI("updateLocal", [{
			cloudSyncLastUpdate: Date.now(),
			cloudSyncPendingChanges: false,
		}]);

		const duration = performance.now() - startTime;
		console.log(`[CloudSync] handleRemoteChanges completed: ${appliedChanges} changes applied in ${duration.toFixed(0)}ms`);
	} else {
		console.log(`[CloudSync] handleRemoteChanges: no changes applied`);
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
	const firestore = await getDb();
	if (!firestore || !currentCloudId) {
		console.log("[CloudSync] syncChangesToCloud: skipped (no firestore or cloudId)");
		return;
	}

	// Skip if not a synced store
	if (!DEFAULT_SYNC_CONFIG.realtime.includes(store) &&
		!DEFAULT_SYNC_CONFIG.onDemand.includes(store)) {
		console.log(`[CloudSync] syncChangesToCloud: skipped store ${store} (not in sync config)`);
		return;
	}

	console.log(`[CloudSync] syncChangesToCloud started`, { store, records: records.length, deletedIds: deletedIds.length });
	const startTime = performance.now();

	isSyncing = true;
	setSyncStatus("syncing");

	try {
		const { doc, writeBatch, serverTimestamp } = firestoreModule;
		const collectionPath = CLOUD_PATHS.leagueStore(currentCloudId, store);

		// Process in batches
		const allOperations: Array<{ type: "set" | "delete"; id: string; data?: any }> = [];

		// Add updates
		for (const record of records) {
			const docId = getDocId(store, record);
			// Clean undefined values - Firestore doesn't accept them
			const cleanedRecord = removeUndefinedValues(record);
			allOperations.push({
				type: "set",
				id: docId,
				data: {
					...cleanedRecord,
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

		console.log(`[CloudSync] syncChangesToCloud: ${allOperations.length} total operations`);

		// Execute in batches
		let batchNum = 0;
		for (let i = 0; i < allOperations.length; i += BATCH_SIZE) {
			batchNum++;
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

			const batchStart = performance.now();
			await batch.commit();
			const batchDuration = performance.now() - batchStart;
			console.log(`[CloudSync] syncChangesToCloud: batch ${batchNum} committed (${batchOps.length} ops) in ${batchDuration.toFixed(0)}ms`);
		}

		// Update league metadata to reflect the sync time
		// This allows other devices to see that there are new changes
		await updateCloudLeagueMeta({ updatedAt: Date.now() });

		const totalDuration = performance.now() - startTime;
		console.log(`[CloudSync] syncChangesToCloud completed in ${totalDuration.toFixed(0)}ms`);
		setSyncStatus("synced");
	} catch (error) {
		console.error(`[CloudSync] Failed to sync ${store} to cloud:`, error);
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
	const firestore = await getDb();
	if (!firestore || !currentCloudId) return [];

	try {
		const { collection, getDocs } = firestoreModule;
		const collectionPath = CLOUD_PATHS.leagueStore(currentCloudId, store);
		const collectionRef = collection(firestore, collectionPath);
		const snapshot = await getDocs(collectionRef);

		const records: any[] = [];
		snapshot.forEach((docSnap: any) => {
			const data = docSnap.data();
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
 * Download all data from a cloud league
 * Returns the data organized by store, plus the league metadata
 */
export const downloadCloudLeague = async (
	cloudId: string,
	userId: string,
): Promise<{ meta: CloudLeague; data: Record<Store, any[]> }> => {
	console.log("[CloudSync] downloadCloudLeague started", { cloudId, userId });
	const startTime = performance.now();

	const firestore = await getDb();
	if (!firestore) {
		console.error("[CloudSync] downloadCloudLeague: Firestore not available");
		throw new Error("Firestore not available");
	}

	const { doc, getDoc, collection, getDocs } = firestoreModule;

	// Get league metadata
	console.log("[CloudSync] Fetching league metadata...");
	const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(cloudId));
	const leagueDoc = await getDoc(leagueRef);

	if (!leagueDoc.exists()) {
		console.error("[CloudSync] League not found:", cloudId);
		throw new Error("Cloud league not found");
	}

	const meta = leagueDoc.data() as CloudLeague;
	console.log("[CloudSync] League metadata:", { name: meta.name, sport: meta.sport });

	// Verify user has access
	if (!meta.members.includes(userId)) {
		console.error("[CloudSync] User not a member");
		throw new Error("You don't have access to this league");
	}

	// Download all stores
	const allStores: Store[] = [
		"allStars", "awards", "draftLotteryResults", "draftPicks",
		"events", "gameAttributes", "games", "headToHeads",
		"messages", "negotiations", "playerFeats", "players",
		"playoffSeries", "releasedPlayers", "savedTrades",
		"savedTradingBlock", "schedule", "scheduledEvents",
		"seasonLeaders", "teamSeasons", "teamStats", "teams", "trade",
	];

	const data: Record<Store, any[]> = {} as any;
	let totalRecords = 0;

	for (let i = 0; i < allStores.length; i++) {
		const store = allStores[i]!;
		const storeStart = performance.now();
		console.log(`[CloudSync] Downloading ${store}... (${i + 1}/${allStores.length})`);
		const collectionPath = CLOUD_PATHS.leagueStore(cloudId, store);
		const collectionRef = collection(firestore, collectionPath);

		try {
			const snapshot = await getDocs(collectionRef);
			const records: any[] = [];

			snapshot.forEach((docSnap: any) => {
				const record = docSnap.data();
				// Remove Firestore metadata
				delete record._cloudUpdatedAt;
				delete record._cloudDeviceId;
				records.push(record);
			});

			data[store] = records;
			totalRecords += records.length;
			const storeDuration = performance.now() - storeStart;
			console.log(`[CloudSync] Downloaded ${store}: ${records.length} records in ${storeDuration.toFixed(0)}ms`);
		} catch (error) {
			console.error(`[CloudSync] Failed to download ${store}:`, error);
			data[store] = [];
		}
	}

	const totalDuration = performance.now() - startTime;
	console.log(`[CloudSync] downloadCloudLeague completed: ${totalRecords} total records in ${(totalDuration / 1000).toFixed(1)}s`);

	return { meta, data };
};

/**
 * Create a new cloud league from local data
 */
export const createCloudLeague = async (
	name: string,
	sport: "basketball" | "football" | "baseball" | "hockey",
	userId: string,
): Promise<string> => {
	console.log("[CloudSync] createCloudLeague started", { name, sport, userId });
	const startTime = performance.now();

	const firestore = await getDb();
	if (!firestore) {
		console.error("[CloudSync] createCloudLeague: Firestore not available");
		throw new Error("Firestore not available");
	}

	const { doc, setDoc } = firestoreModule;

	// Generate a new cloud ID
	const cloudId = `league-${Date.now()}-${Math.random().toString(36).slice(2)}`;
	console.log("[CloudSync] Generated cloudId:", cloudId);

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
	console.log("[CloudSync] Creating league document...");
	const leagueRef = doc(firestore, CLOUD_PATHS.leagueMeta(cloudId));
	await setDoc(leagueRef, leagueData);

	const duration = performance.now() - startTime;
	console.log(`[CloudSync] createCloudLeague completed in ${duration.toFixed(0)}ms`, { cloudId });

	return cloudId;
};

/**
 * Estimate JSON size of an object (rough approximation)
 */
const estimateSize = (obj: any): number => {
	try {
		return JSON.stringify(obj).length;
	} catch {
		return 10000; // Default estimate for non-serializable objects
	}
};

// Helper to update upload progress in UI
const setUploadProgress = (message: string | null) => {
	console.log(`[CloudSync] Progress: ${message}`);
	toUI("updateLocal", [{ cloudUploadProgress: message }]);
};

/**
 * Upload entire local league to cloud
 */
export const uploadLeagueToCloud = async (
	cloudId: string,
	getAllData: () => Promise<Record<Store, any[]>>,
): Promise<void> => {
	console.log("[CloudSync] uploadLeagueToCloud started", { cloudId });
	const uploadStartTime = performance.now();

	setUploadProgress("Initializing upload...");

	const firestore = await getDb();
	if (!firestore) {
		console.error("[CloudSync] Firestore not available");
		setUploadProgress(null);
		throw new Error("Firestore not available");
	}
	console.log("[CloudSync] Firestore initialized");

	const { doc, writeBatch, serverTimestamp } = firestoreModule;

	setSyncStatus("syncing");

	try {
		setUploadProgress("Collecting league data...");
		console.log("[CloudSync] Calling getAllData()...");
		const getAllDataStart = performance.now();
		const allData = await getAllData();
		const getAllDataDuration = performance.now() - getAllDataStart;
		console.log(`[CloudSync] getAllData() completed in ${getAllDataDuration.toFixed(0)}ms`);

		const stores = Object.keys(allData) as Store[];
		console.log(`[CloudSync] Total stores to upload: ${stores.length}`, stores);

		// Calculate total records
		let totalRecords = 0;
		for (const store of stores) {
			totalRecords += (allData[store] || []).length;
		}
		console.log(`[CloudSync] Total records across all stores: ${totalRecords}`);
		setUploadProgress(`Uploading ${totalRecords.toLocaleString()} records...`);

		let uploadedRecords = 0;

		for (let i = 0; i < stores.length; i++) {
			const store = stores[i]!;
			const records = allData[store] || [];

			if (records.length === 0) {
				console.log(`[CloudSync] Skipping ${store} (empty)`);
				continue;
			}

			const storeStartTime = performance.now();
			const progressPct = Math.round((uploadedRecords / totalRecords) * 100);
			setUploadProgress(`Uploading ${store} (${records.length} records)... ${progressPct}%`);
			console.log(`[CloudSync] Uploading ${store}: ${records.length} records (store ${i + 1}/${stores.length})`);
			const collectionPath = CLOUD_PATHS.leagueStore(cloudId, store);

			// Upload with size-aware batching
			let batch = writeBatch(firestore);
			let batchCount = 0;
			let batchSize = 0;
			let batchNum = 1;
			let totalBatches = Math.ceil(records.length / BATCH_SIZE);

			for (let j = 0; j < records.length; j++) {
				const record = records[j];
				const docId = getDocId(store, record);
				const docRef = doc(firestore, collectionPath, docId);
				// Clean undefined values - Firestore doesn't accept them
				const cleanedRecord = removeUndefinedValues(record);
				const recordData = {
					...cleanedRecord,
					_cloudUpdatedAt: serverTimestamp(),
					_cloudDeviceId: deviceId,
				};

				const recordSize = estimateSize(recordData);

				// Commit batch if we hit count or size limit
				if (batchCount > 0 && (batchCount >= BATCH_SIZE || batchSize + recordSize > MAX_PAYLOAD_SIZE)) {
					const batchStart = performance.now();
					const currentPct = Math.round(((uploadedRecords + j) / totalRecords) * 100);
					setUploadProgress(`Uploading ${store} batch ${batchNum}/${totalBatches}... ${currentPct}%`);
					console.log(`[CloudSync] ${store}: Committing batch ${batchNum}/${totalBatches} (${batchCount} records, ${(batchSize / 1024).toFixed(1)}KB)`);
					await batch.commit();
					const batchDuration = performance.now() - batchStart;
					console.log(`[CloudSync] ${store}: Batch ${batchNum} committed in ${batchDuration.toFixed(0)}ms`);
					batch = writeBatch(firestore);
					batchCount = 0;
					batchSize = 0;
					batchNum++;
				}

				batch.set(docRef, recordData);
				batchCount++;
				batchSize += recordSize;
			}

			// Commit remaining records
			if (batchCount > 0) {
				const batchStart = performance.now();
				const currentPct = Math.round(((uploadedRecords + records.length) / totalRecords) * 100);
				setUploadProgress(`Uploading ${store} (final batch)... ${currentPct}%`);
				console.log(`[CloudSync] ${store}: Committing final batch ${batchNum} (${batchCount} records, ${(batchSize / 1024).toFixed(1)}KB)`);
				await batch.commit();
				const batchDuration = performance.now() - batchStart;
				console.log(`[CloudSync] ${store}: Final batch committed in ${batchDuration.toFixed(0)}ms`);
			}

			uploadedRecords += records.length;
			const storeDuration = performance.now() - storeStartTime;
			console.log(`[CloudSync] ${store}: Completed in ${storeDuration.toFixed(0)}ms (${uploadedRecords}/${totalRecords} total records done)`);
		}

		const totalDuration = performance.now() - uploadStartTime;
		console.log(`[CloudSync] uploadLeagueToCloud completed in ${(totalDuration / 1000).toFixed(1)}s`);
		setUploadProgress("Upload complete!");
		// Clear progress after a brief delay
		setTimeout(() => setUploadProgress(null), 2000);
		setSyncStatus("synced");
	} catch (error) {
		const errorDuration = performance.now() - uploadStartTime;
		console.error(`[CloudSync] Upload failed after ${(errorDuration / 1000).toFixed(1)}s:`, error);
		setUploadProgress(`Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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
	const firestore = await getDb();
	if (!firestore || !currentCloudId || !currentUserId) {
		return true; // Allow operation if not connected to cloud
	}

	const { doc, getDoc, setDoc } = firestoreModule;
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

	const firestore = await getDb();
	if (!firestore || !currentCloudId || !currentLock) {
		currentLock = null;
		return;
	}

	try {
		const { doc, deleteDoc } = firestoreModule;
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
	const firestore = await getDb();
	if (!firestore || !currentCloudId) return;

	try {
		const { doc, setDoc } = firestoreModule;
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
	console.log("[CloudSync] getCloudLeagues started", { userId });
	const startTime = performance.now();

	const firestore = await getDb();
	if (!firestore) {
		console.log("[CloudSync] getCloudLeagues: Firestore not available");
		return [];
	}

	try {
		const { collection, query, where, getDocs } = firestoreModule;
		const leaguesRef = collection(firestore, "leagues");
		const q = query(leaguesRef, where("members", "array-contains", userId));
		const snapshot = await getDocs(q);

		const leagues: CloudLeague[] = [];
		snapshot.forEach((docSnap: any) => {
			leagues.push(docSnap.data() as CloudLeague);
		});

		const duration = performance.now() - startTime;
		console.log(`[CloudSync] getCloudLeagues completed: ${leagues.length} leagues in ${duration.toFixed(0)}ms`);

		return leagues.sort((a, b) => b.updatedAt - a.updatedAt);
	} catch (error) {
		console.error("[CloudSync] Failed to get cloud leagues:", error);
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
	const firestore = await getDb();
	if (!firestore) return false;

	try {
		const { doc, getDoc, deleteDoc } = firestoreModule;

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
