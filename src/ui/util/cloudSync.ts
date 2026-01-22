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
	limit,
	startAfter,
	orderBy,
	type Unsubscribe,
	type QueryDocumentSnapshot,
	type DocumentData,
	type QuerySnapshot,
} from "firebase/firestore";
import { getFirebaseDb, getFirebaseAuth, getCurrentUserId, getUserDisplayName, getUserEmail } from "./firebase.ts";
import type { Store, CloudLeague, CloudMember, CloudSyncStatus } from "../../common/cloudTypes.ts";
import { toWorker } from "./index.ts";

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

// Pending updates state - for notification-based sync
let pendingUpdateCallback: ((info: PendingUpdateInfo | null) => void) | null = null;
let lastKnownUpdateTime: number = 0;

export type PendingUpdateInfo = {
	updatedAt: number;
	updatedBy: string; // displayName of who made the change
	message?: string;
};

// Set callback for pending update notifications
export const onPendingUpdate = (callback: (info: PendingUpdateInfo | null) => void) => {
	pendingUpdateCallback = callback;
};

// Notify UI of pending update
const notifyPendingUpdate = (info: PendingUpdateInfo | null) => {
	if (pendingUpdateCallback) {
		pendingUpdateCallback(info);
	}
};

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
		const allData = await toWorker("main", "getLeagueDataForCloud", undefined) as Record<Store, any[]>;
		console.log("[uploadLeagueData] Got data from worker");

		// Count total records
		let totalRecords = 0;
		for (const store of ALL_STORES) {
			totalRecords += (allData[store] || []).length;
		}

		let uploadedRecords = 0;
		// Use smaller batch size to avoid payload limit (10MB max per request)
		const BATCH_SIZE = 50;

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
					// Serialize as JSON to avoid Firestore limitations (nested arrays, undefined, etc.)
					batch.set(docRef, { _json: JSON.stringify(record) });
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
				const docData = docSnap.data();
				// Parse JSON back to original format
				if (docData._json) {
					data[store].push(JSON.parse(docData._json));
				} else {
					data[store].push(docData);
				}
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
 * STREAMING download - Downloads league data from Firestore in small batches
 * to avoid memory exhaustion on mobile devices.
 *
 * Instead of loading all data into memory at once, this function:
 * 1. Creates the league database first
 * 2. Streams each store from Firestore using pagination (500 docs at a time)
 * 3. Immediately writes each batch to IndexedDB via worker
 * 4. Finalizes the league after all data is downloaded
 *
 * This approach keeps memory usage low and works well on mobile devices.
 */
export const streamDownloadLeagueData = async (
	cloudId: string,
	leagueName: string,
	memberTeamId: number | undefined,
	onProgress?: (message: string, percent: number) => void,
): Promise<number> => {
	const db = getFirebaseDb();
	setSyncStatus("syncing");

	const BATCH_SIZE = 500; // Documents per Firestore query
	const totalStores = ALL_STORES.length;

	try {
		onProgress?.("Initializing league...", 1);

		// Initialize the league in worker (creates empty database)
		const lid = await toWorker("main", "initCloudLeagueDownload", {
			cloudId,
			name: leagueName,
		});

		try {
			// Stream each store
			let storeIndex = 0;
			for (const store of ALL_STORES) {
				const storePercent = Math.round((storeIndex / totalStores) * 90) + 5;
				onProgress?.(`Downloading ${store}...`, storePercent);

				const collectionPath = `leagues/${cloudId}/stores/${store}/data`;
				const collectionRef = collection(db, collectionPath);

				// Use pagination to fetch in batches
				let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;
				let hasMore = true;
				let batchCount = 0;

				while (hasMore) {
					// Build query with pagination
					const baseQuery = query(collectionRef, orderBy("__name__"), limit(BATCH_SIZE));
					const paginatedQuery = lastDoc
						? query(collectionRef, orderBy("__name__"), startAfter(lastDoc), limit(BATCH_SIZE))
						: baseQuery;

					const snapshot: QuerySnapshot<DocumentData> = await getDocs(paginatedQuery);

					if (snapshot.empty) {
						hasMore = false;
						break;
					}

					// Parse the batch
					const records: any[] = [];
					snapshot.forEach((docSnap: QueryDocumentSnapshot) => {
						const docData = docSnap.data();
						// Parse JSON back to original format
						if (docData._json) {
							records.push(JSON.parse(docData._json));
						} else {
							records.push(docData);
						}
					});

					// Send batch to worker to write to IndexedDB
					await toWorker("main", "writeCloudStoreBatch", {
						store,
						records,
					});

					batchCount++;

					// Update progress within the store
					const batchPercent = storePercent + Math.min(batchCount, 5);
					onProgress?.(`Downloading ${store}... (batch ${batchCount})`, batchPercent);

					// Check if there are more documents
					if (snapshot.docs.length < BATCH_SIZE) {
						hasMore = false;
					} else {
						lastDoc = snapshot.docs[snapshot.docs.length - 1] ?? null;
					}
				}

				storeIndex++;
			}

			// Finalize the league (updates metadata from actual data)
			onProgress?.("Finalizing league...", 97);
			await toWorker("main", "finalizeCloudLeagueDownload", {
				memberTeamId,
			});

			setSyncStatus("synced");
			onProgress?.("Download complete!", 100);

			return lid;
		} catch (error) {
			// Clean up partial download
			await toWorker("main", "cancelCloudLeagueDownload", undefined);
			throw error;
		}
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
 * Start real-time sync for a cloud league.
 *
 * LIGHTWEIGHT APPROACH: Instead of 22 aggressive listeners that cause lag,
 * we only listen to the league metadata document for updates.
 * When another user makes changes, we show a notification and let the
 * user choose when to refresh - just like BBGM's local file behavior.
 */
export const startRealtimeSync = async (cloudId: string): Promise<void> => {
	const db = getFirebaseDb();

	// Stop any existing sync
	stopRealtimeSync();

	currentCloudId = cloudId;
	setSyncStatus("connecting");

	// Load current user's membership info for permission checks
	await loadCurrentCloudMember();

	// Get current update time as baseline
	const league = await getCloudLeague(cloudId);
	if (league) {
		lastKnownUpdateTime = league.updatedAt || 0;
	}

	try {
		// LIGHTWEIGHT: Only listen to league metadata document, not all 22 stores!
		// This single listener detects when ANY changes are made to the league.
		const leagueDocRef = doc(db, "leagues", cloudId);

		const unsubscribe = onSnapshot(leagueDocRef, (docSnapshot) => {
			if (!docSnapshot.exists()) return;

			const data = docSnapshot.data() as CloudLeague;
			const newUpdateTime = data.updatedAt || 0;

			// If update time changed and it's newer than what we know
			if (newUpdateTime > lastKnownUpdateTime) {
				// Find who made the change (not us)
				const userId = getCurrentUserId();
				const updater = data.lastUpdatedBy || "Someone";

				// Don't notify about our own changes
				if (data.lastUpdatedByUserId !== userId) {
					notifyPendingUpdate({
						updatedAt: newUpdateTime,
						updatedBy: updater,
						message: data.lastUpdateMessage,
					});
				} else {
					// Our own change - just update the baseline
					lastKnownUpdateTime = newUpdateTime;
				}
			}
		}, (error) => {
			console.error("League metadata listener error:", error);
			setSyncStatus("error");
		});

		listeners.set("__metadata__", unsubscribe);
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
	currentCloudMember = null;
	lastKnownUpdateTime = 0;
	notifyPendingUpdate(null);
	setSyncStatus("disconnected");
};

/**
 * Refresh league data from cloud.
 * Called when user clicks "Update Available" notification.
 * Downloads fresh data and reloads the league.
 */
export const refreshFromCloud = async (): Promise<void> => {
	if (!currentCloudId) {
		throw new Error("Not connected to a cloud league");
	}

	const cloudId = currentCloudId;

	// Get league info
	const league = await getCloudLeague(cloudId);
	if (!league) {
		throw new Error("League not found");
	}

	// Update our baseline time
	lastKnownUpdateTime = league.updatedAt || Date.now();

	// Clear pending notification
	notifyPendingUpdate(null);

	// Reload the page to get fresh data
	// This is the simplest approach - the league will re-download from cloud
	window.location.reload();
};

/**
 * Mark that we just made changes (updates the league metadata)
 * Call this after syncing local changes to cloud.
 */
export const markLeagueUpdated = async (message?: string): Promise<void> => {
	if (!currentCloudId) return;

	const db = getFirebaseDb();
	const userId = getCurrentUserId();
	const displayName = getUserDisplayName() || "Unknown";

	const now = Date.now();
	lastKnownUpdateTime = now;

	await setDoc(doc(db, "leagues", currentCloudId), {
		updatedAt: now,
		lastUpdatedBy: displayName,
		lastUpdatedByUserId: userId,
		lastUpdateMessage: message,
	}, { merge: true });
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
			// Serialize as JSON to avoid Firestore limitations
			batch.set(docRef, { _json: JSON.stringify(record) });
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

	// Update league metadata with user info for notifications
	const userId = getCurrentUserId();
	const displayName = getUserDisplayName() || "Unknown";
	const now = Date.now();
	lastKnownUpdateTime = now; // Update our baseline so we don't notify ourselves

	await setDoc(doc(db, "leagues", currentCloudId), {
		updatedAt: now,
		lastUpdatedBy: displayName,
		lastUpdatedByUserId: userId,
		lastUpdateMessage: `Updated ${store}`,
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

/**
 * Join a cloud league as a member (for non-owners)
 * The user provides the cloudId (shared by the commissioner)
 */
export const joinCloudLeague = async (
	cloudId: string,
	teamId: number,
): Promise<CloudLeague> => {
	const db = getFirebaseDb();
	const auth = getFirebaseAuth();
	const user = auth.currentUser;
	if (!user) throw new Error("Not signed in");

	// Get the league
	const league = await getCloudLeague(cloudId);
	if (!league) throw new Error("League not found. Check the league ID and try again.");

	// Check if already a member
	const existingMember = league.members.find(m => m.userId === user.uid);
	if (existingMember) {
		throw new Error("You are already a member of this league");
	}

	// Check if team is already taken
	const teamTaken = league.members.find(m => m.teamId === teamId);
	if (teamTaken) {
		throw new Error(`Team ${teamId} is already claimed by ${teamTaken.displayName}`);
	}

	// Add self as member
	const member: CloudMember = {
		userId: user.uid,
		displayName: user.displayName || user.email || "Unknown",
		teamId,
		role: "member",
		joinedAt: Date.now(),
	};
	if (user.email) {
		member.email = user.email;
	}

	// Update league with new member
	await setDoc(doc(db, "leagues", cloudId), {
		members: [...league.members, member],
		updatedAt: Date.now(),
	}, { merge: true });

	return { ...league, members: [...league.members, member] };
};

/**
 * Get leagues the current user is a member of (but not owner)
 */
export const getJoinedLeagues = async (): Promise<CloudLeague[]> => {
	const db = getFirebaseDb();
	const auth = getFirebaseAuth();
	const user = auth.currentUser;
	if (!user) return [];

	// Note: Firestore array-contains needs exact object match, so we can't query by userId alone
	// For now, fetch all leagues and filter client-side
	// TODO: Use a separate "memberships" subcollection for better scalability

	const allLeaguesSnapshot = await getDocs(collection(db, "leagues"));
	const leagues: CloudLeague[] = [];

	allLeaguesSnapshot.forEach((docSnap) => {
		const data = docSnap.data() as CloudLeague;
		// Check if user is a member (but not owner - those are in getCloudLeagues)
		if (data.ownerId !== user.uid) {
			const isMember = data.members?.some(m => m.userId === user.uid);
			if (isMember) {
				leagues.push({
					...data,
					cloudId: docSnap.id,
				});
			}
		}
	});

	return leagues;
};

/**
 * Get list of teams and their current owners for a league
 */
export const getLeagueMembers = async (cloudId: string): Promise<CloudMember[]> => {
	const league = await getCloudLeague(cloudId);
	return league?.members || [];
};

/**
 * Get teams from a cloud league for team selection UI
 */
export type CloudTeam = {
	tid: number;
	region: string;
	name: string;
	abbrev: string;
	claimedBy?: string; // displayName of user who claimed this team
};

export const getCloudLeagueTeams = async (cloudId: string): Promise<CloudTeam[]> => {
	const db = getFirebaseDb();

	// Get the league to check members
	const league = await getCloudLeague(cloudId);
	if (!league) throw new Error("League not found");

	// Get teams from Firestore
	const teamsPath = `leagues/${cloudId}/stores/teams/data`;
	const teamsSnapshot = await getDocs(collection(db, teamsPath));

	const teams: CloudTeam[] = [];
	teamsSnapshot.forEach((docSnap) => {
		const data = docSnap.data();
		// Parse JSON if stored that way
		const teamData = data._json ? JSON.parse(data._json) : data;

		// Check if this team is claimed
		const claimer = league.members.find(m => m.teamId === teamData.tid);

		teams.push({
			tid: teamData.tid,
			region: teamData.region || "???",
			name: teamData.name || "???",
			abbrev: teamData.abbrev || "???",
			claimedBy: claimer?.displayName,
		});
	});

	// Sort by tid
	teams.sort((a, b) => a.tid - b.tid);

	return teams;
};

// ==== Cloud Permission System ====

// Current user's cloud membership (cached for the active league)
let currentCloudMember: CloudMember | null = null;

/**
 * Get the current user's membership info for the active cloud league
 */
export const getCurrentCloudMember = (): CloudMember | null => currentCloudMember;

/**
 * Load/refresh the current user's cloud membership
 */
export const loadCurrentCloudMember = async (): Promise<CloudMember | null> => {
	if (!currentCloudId) {
		currentCloudMember = null;
		return null;
	}

	const userId = getCurrentUserId();
	if (!userId) {
		currentCloudMember = null;
		return null;
	}

	const league = await getCloudLeague(currentCloudId);
	if (!league) {
		currentCloudMember = null;
		return null;
	}

	currentCloudMember = league.members.find(m => m.userId === userId) || null;
	return currentCloudMember;
};

/**
 * Check if the current user is the commissioner of the active cloud league
 */
export const isCloudCommissioner = (): boolean => {
	return currentCloudMember?.role === "commissioner";
};

/**
 * Get the team ID the current user controls in the cloud league
 */
export const getCloudUserTeamId = (): number | null => {
	return currentCloudMember?.teamId ?? null;
};

/**
 * Check if the current user can control a specific team
 */
export const canControlTeam = (teamId: number): boolean => {
	// If not in a cloud league, allow all teams
	if (!currentCloudId || !currentCloudMember) {
		return true;
	}

	// User can only control their assigned team
	return currentCloudMember.teamId === teamId;
};

/**
 * Check if the current user can simulate games (commissioner only)
 */
export const canSimulateGames = (): boolean => {
	// If not in a cloud league, allow simulation
	if (!currentCloudId || !currentCloudMember) {
		return true;
	}

	// Only commissioner can simulate
	return currentCloudMember.role === "commissioner";
};
