/**
 * Cloud Sync Service
 *
 * Handles all Firestore operations for cloud league synchronization.
 * This runs entirely in the UI thread since Firebase doesn't work in SharedWorker.
 */

import {
	doc,
	setDoc,
	getDoc,
	getDocs,
	deleteDoc,
	collection,
	query,
	where,
	writeBatch,
	onSnapshot,
	serverTimestamp,
	type Unsubscribe,
} from "firebase/firestore";
import { getFirebaseDb, getCurrentUserId, getUserDisplayName, getUserEmail } from "./firebase.ts";
import type { Store, CloudLeague, CloudMember, CloudSyncStatus } from "../../common/cloudTypes.ts";
import { toWorker, realtimeUpdate } from "./index.ts";

// All stores that need to be synced
const ALL_STORES: Store[] = [
	"allStars", "awards", "draftLotteryResults", "draftPicks", "events",
	"gameAttributes", "games", "headToHeads", "messages", "negotiations",
	"playerFeats", "players", "playoffSeries", "releasedPlayers", "savedTrades",
	"savedTradingBlock", "schedule", "scheduledEvents", "seasonLeaders",
	"teamSeasons", "teamStats", "teams", "trade",
];

// Primary keys for each store
const STORE_PRIMARY_KEYS: Record<Store, string> = {
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

// Current state
let currentCloudId: string | null = null;
let syncStatus: CloudSyncStatus = "disconnected";
let listeners: Map<string, Unsubscribe> = new Map();
let statusCallback: ((status: CloudSyncStatus) => void) | null = null;

// Remove undefined values (Firestore doesn't accept them)
const removeUndefined = (obj: any): any => {
	if (obj === null || obj === undefined) return null;
	if (Array.isArray(obj)) return obj.map(removeUndefined);
	if (typeof obj === "object") {
		const cleaned: Record<string, any> = {};
		for (const [key, value] of Object.entries(obj)) {
			if (value !== undefined) {
				cleaned[key] = removeUndefined(value);
			}
		}
		return cleaned;
	}
	return obj;
};

// Set status callback
export const onSyncStatusChange = (callback: (status: CloudSyncStatus) => void) => {
	statusCallback = callback;
};

// Update sync status
const setSyncStatus = (status: CloudSyncStatus) => {
	syncStatus = status;
	if (statusCallback) {
		statusCallback(status);
	}
};

// Get current sync status
export const getSyncStatus = (): CloudSyncStatus => syncStatus;

// Get current cloud ID
export const getCurrentCloudId = (): string | null => currentCloudId;

/**
 * Create a new cloud league
 */
export const createCloudLeague = async (
	name: string,
	sport: "basketball" | "football" | "baseball" | "hockey",
	userTeamId: number,
): Promise<string> => {
	console.log("[createCloudLeague] Starting...");
	const db = getFirebaseDb();
	console.log("[createCloudLeague] Got db");
	const userId = getCurrentUserId();
	console.log("[createCloudLeague] userId:", userId);
	if (!userId) throw new Error("Not signed in");

	const cloudId = `league-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	console.log("[createCloudLeague] cloudId:", cloudId);

	const email = getUserEmail();
	const member: CloudMember = {
		userId: userId,
		displayName: getUserDisplayName() || "Unknown",
		teamId: userTeamId,
		role: "commissioner",
		joinedAt: Date.now(),
	};
	// Only add email if it exists (Firestore doesn't accept undefined)
	if (email) {
		member.email = email;
	}

	const leagueData = {
		cloudId,
		name,
		sport,
		ownerId: userId,
		members: [member],
		createdAt: Date.now(),
		updatedAt: Date.now(),
		season: 0,
		phase: 0,
		schemaVersion: 1,
	};

	console.log("[createCloudLeague] Calling setDoc...");
	await setDoc(doc(db, "leagues", cloudId), removeUndefined(leagueData));
	console.log("[createCloudLeague] setDoc complete!");

	return cloudId;
};

/**
 * Upload league data to Firestore
 */
export const uploadLeagueData = async (
	cloudId: string,
	onProgress?: (message: string, percent: number) => void,
): Promise<void> => {
	console.log("[uploadLeagueData] Starting for cloudId:", cloudId);
	const db = getFirebaseDb();
	setSyncStatus("syncing");

	try {
		// Get all data from worker
		console.log("[uploadLeagueData] Calling toWorker getLeagueDataForCloud...");
		onProgress?.("Collecting league data...", 0);
		const allData = await toWorker("main", "getLeagueDataForCloud") as Record<Store, any[]>;
		console.log("[uploadLeagueData] Got data from worker");

		// Count total records
		let totalRecords = 0;
		for (const store of ALL_STORES) {
			totalRecords += (allData[store] || []).length;
		}

		let uploadedRecords = 0;
		const BATCH_SIZE = 400; // Firestore limit is 500

		for (const store of ALL_STORES) {
			const records = allData[store] || [];
			if (records.length === 0) continue;

			const pk = STORE_PRIMARY_KEYS[store];
			const collectionPath = `leagues/${cloudId}/stores/${store}/data`;

			// Upload in batches
			for (let i = 0; i < records.length; i += BATCH_SIZE) {
				const batch = writeBatch(db);
				const batchRecords = records.slice(i, i + BATCH_SIZE);

				for (const record of batchRecords) {
					const docId = String(record[pk]);
					const docRef = doc(db, collectionPath, docId);
					batch.set(docRef, removeUndefined(record));
				}

				await batch.commit();
				uploadedRecords += batchRecords.length;

				const percent = Math.round((uploadedRecords / totalRecords) * 100);
				onProgress?.(`Uploading ${store}...`, percent);
			}
		}

		// Update league metadata
		await setDoc(doc(db, "leagues", cloudId), {
			updatedAt: Date.now(),
		}, { merge: true });

		setSyncStatus("synced");
		onProgress?.("Upload complete!", 100);
	} catch (error) {
		setSyncStatus("error");
		throw error;
	}
};

/**
 * Download league data from Firestore
 */
export const downloadLeagueData = async (
	cloudId: string,
	onProgress?: (message: string, percent: number) => void,
): Promise<Record<Store, any[]>> => {
	const db = getFirebaseDb();
	setSyncStatus("syncing");

	try {
		const data: Record<Store, any[]> = {} as any;
		let storeIndex = 0;

		for (const store of ALL_STORES) {
			onProgress?.(`Downloading ${store}...`, Math.round((storeIndex / ALL_STORES.length) * 100));

			const collectionPath = `leagues/${cloudId}/stores/${store}/data`;
			const snapshot = await getDocs(collection(db, collectionPath));

			data[store] = [];
			snapshot.forEach((docSnap) => {
				data[store].push(docSnap.data());
			});

			storeIndex++;
		}

		setSyncStatus("synced");
		onProgress?.("Download complete!", 100);
		return data;
	} catch (error) {
		setSyncStatus("error");
		throw error;
	}
};

/**
 * Get list of cloud leagues user has access to
 */
export const getCloudLeagues = async (): Promise<CloudLeague[]> => {
	const db = getFirebaseDb();
	const userId = getCurrentUserId();
	if (!userId) return [];

	try {
		// Query leagues where user is the owner
		const ownerQuery = query(
			collection(db, "leagues"),
			where("ownerId", "==", userId)
		);
		const ownerSnapshot = await getDocs(ownerQuery);

		const leagues: CloudLeague[] = [];
		ownerSnapshot.forEach((docSnap) => {
			leagues.push(docSnap.data() as CloudLeague);
		});

		// Sort by updatedAt descending
		return leagues.sort((a, b) => b.updatedAt - a.updatedAt);
	} catch (error) {
		console.error("Failed to get cloud leagues:", error);
		return [];
	}
};

/**
 * Get cloud league metadata
 */
export const getCloudLeague = async (cloudId: string): Promise<CloudLeague | null> => {
	const db = getFirebaseDb();

	try {
		const docSnap = await getDoc(doc(db, "leagues", cloudId));
		if (docSnap.exists()) {
			return docSnap.data() as CloudLeague;
		}
		return null;
	} catch (error) {
		console.error("Failed to get cloud league:", error);
		return null;
	}
};

/**
 * Delete a cloud league
 */
export const deleteCloudLeague = async (cloudId: string): Promise<void> => {
	const db = getFirebaseDb();
	const userId = getCurrentUserId();
	if (!userId) throw new Error("Not signed in");

	// Verify ownership
	const league = await getCloudLeague(cloudId);
	if (!league) throw new Error("League not found");
	if (league.ownerId !== userId) throw new Error("You don't own this league");

	// Delete the league document (subcollections will be orphaned but that's ok for now)
	await deleteDoc(doc(db, "leagues", cloudId));
};

/**
 * Start real-time sync for a cloud league
 */
export const startRealtimeSync = async (cloudId: string): Promise<void> => {
	const db = getFirebaseDb();

	// Stop any existing sync
	stopRealtimeSync();

	currentCloudId = cloudId;
	setSyncStatus("connecting");

	try {
		// Listen for changes on each store
		for (const store of ALL_STORES) {
			const collectionPath = `leagues/${cloudId}/stores/${store}/data`;
			const collectionRef = collection(db, collectionPath);

			const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
				const changes: Array<{ type: string; id: string; data: any }> = [];

				snapshot.docChanges().forEach((change) => {
					changes.push({
						type: change.type,
						id: change.doc.id,
						data: change.doc.data(),
					});
				});

				if (changes.length > 0) {
					handleRemoteChanges(store, changes);
				}
			}, (error) => {
				console.error(`Listener error for ${store}:`, error);
				setSyncStatus("error");
			});

			listeners.set(store, unsubscribe);
		}

		setSyncStatus("synced");
	} catch (error) {
		setSyncStatus("error");
		throw error;
	}
};

/**
 * Stop real-time sync
 */
export const stopRealtimeSync = () => {
	for (const unsubscribe of listeners.values()) {
		unsubscribe();
	}
	listeners.clear();
	currentCloudId = null;
	setSyncStatus("disconnected");
};

/**
 * Handle changes received from Firestore
 */
const handleRemoteChanges = async (
	store: Store,
	changes: Array<{ type: string; id: string; data: any }>,
) => {
	console.log(`[CloudSync] Received ${changes.length} changes for ${store}`);

	// Send changes to worker to apply to IndexedDB
	try {
		await toWorker("main", "applyCloudChanges", { store, changes });

		// Trigger UI refresh
		realtimeUpdate(["gameSim", "playerMovement"]);
	} catch (error) {
		console.error(`Failed to apply remote changes for ${store}:`, error);
	}
};

/**
 * Sync local changes to Firestore
 */
export const syncLocalChanges = async (
	store: Store,
	records: any[],
	deletedIds: (string | number)[],
): Promise<void> => {
	if (!currentCloudId) return;

	const db = getFirebaseDb();
	const pk = STORE_PRIMARY_KEYS[store];
	const collectionPath = `leagues/${currentCloudId}/stores/${store}/data`;

	const BATCH_SIZE = 400;

	// Process updates
	for (let i = 0; i < records.length; i += BATCH_SIZE) {
		const batch = writeBatch(db);
		const batchRecords = records.slice(i, i + BATCH_SIZE);

		for (const record of batchRecords) {
			const docId = String(record[pk]);
			const docRef = doc(db, collectionPath, docId);
			batch.set(docRef, removeUndefined(record));
		}

		await batch.commit();
	}

	// Process deletes
	for (let i = 0; i < deletedIds.length; i += BATCH_SIZE) {
		const batch = writeBatch(db);
		const batchIds = deletedIds.slice(i, i + BATCH_SIZE);

		for (const id of batchIds) {
			const docRef = doc(db, collectionPath, String(id));
			batch.delete(docRef);
		}

		await batch.commit();
	}

	// Update league metadata
	await setDoc(doc(db, "leagues", currentCloudId), {
		updatedAt: Date.now(),
	}, { merge: true });
};

/**
 * Add a member to a cloud league
 */
export const addLeagueMember = async (
	cloudId: string,
	userId: string,
	displayName: string,
	email: string | undefined,
	teamId: number,
): Promise<void> => {
	const db = getFirebaseDb();
	const currentUserId = getCurrentUserId();
	if (!currentUserId) throw new Error("Not signed in");

	// Verify ownership
	const league = await getCloudLeague(cloudId);
	if (!league) throw new Error("League not found");
	if (league.ownerId !== currentUserId) throw new Error("Only the owner can add members");

	const member: CloudMember = {
		userId: userId,
		displayName,
		teamId,
		role: "member",
		joinedAt: Date.now(),
	};
	// Only add email if it exists (Firestore doesn't accept undefined)
	if (email) {
		member.email = email;
	}

	// Add to members array
	await setDoc(doc(db, "leagues", cloudId), {
		members: [...league.members, member],
		updatedAt: Date.now(),
	}, { merge: true });
};
