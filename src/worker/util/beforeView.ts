import { Cache, connectLeague, idb } from "../db";
import { league } from "../core";
import {
	env,
	g,
	helpers,
	initUILocalGames,
	local,
	toUI,
	updatePhase,
	updatePlayMenu,
	updateStatus,
} from ".";
import type { Conditions, League, ThenArg } from "../../common/types";

let heartbeatIntervalID: number;

// Heartbeat stuff would be better inside a single transaction, but Firefox doesn't like that.

const getLeague = async (lid: number) => {
	// Make sure this league exists before proceeding
	const l = await idb.meta.get("leagues", lid);

	if (l === undefined) {
		throw new Error("League not found.");
	}

	return l;
};

const runHeartbeat = async (l: League) => {
	l.heartbeatID = env.heartbeatID;
	l.heartbeatTimestamp = Date.now();
	await idb.meta.put("leagues", l);
};

const startHeartbeat = async (l: ThenArg<ReturnType<typeof getLeague>>) => {
	// First one within this transaction
	await runHeartbeat(l);

	// Then in new transaction
	const lid = l.lid;
	setTimeout(() => {
		clearInterval(heartbeatIntervalID); // Shouldn't be necessary, but just in case

		heartbeatIntervalID = self.setInterval(async () => {
			const l2 = await getLeague(lid);
			await runHeartbeat(l2);
		}, 1000);
	}, 1000);
};

// Check if loaded in another tab
const checkHeartbeat = async (lid: number) => {
	const l = await getLeague(lid);
	const { heartbeatID, heartbeatTimestamp } = l;

	if (heartbeatID === undefined || heartbeatTimestamp === undefined) {
		await startHeartbeat(l);
		return;
	}

	// If this is the same active tab (like on ctrl+R), no problem
	if (env.heartbeatID === heartbeatID) {
		await startHeartbeat(l);
		return;
	}

	// Difference between now and stored heartbeat in milliseconds
	const diff = Date.now() - heartbeatTimestamp;

	// If diff is greater than 5 seconds, assume other tab was closed
	if (diff > 5 * 1000) {
		await startHeartbeat(l);
		return;
	}

	let errorMessage =
		"A league can only be open in one tab at a time. If this league is not open in another tab, please wait a few seconds and reload. Or switch to Chrome on a desktop/laptop, which doesn't have this limitation.";

	if (navigator.userAgent.includes("Firefox")) {
		errorMessage +=
			" (Firefox used to let you open a league in multiple tabs, but a bug introduced in Firefox 57 forced me to disable that feature.)";
	}

	throw new Error(errorMessage);
};

// beforeLeague runs when the user switches leagues (including the initial league selection).
let loadingNewLid;
const beforeLeague = async (
	newLid: number,
	loadedLid: number | undefined,
	conditions?: Conditions,
) => {
	// Make sure league template FOR THE CURRENT LEAGUE is showing
	loadingNewLid = newLid;
	const switchingDatabaseLid = newLid !== g.get("lid");

	if (switchingDatabaseLid) {
		await league.close(true);
	}

	if (loadingNewLid !== newLid) {
		return;
	}

	// Check after every async action
	// If this is a Web Worker, only one tab of a league can be open at a time

	if (!env.useSharedWorker) {
		clearInterval(heartbeatIntervalID);
		await checkHeartbeat(newLid);
	}

	if (loadingNewLid !== newLid) {
		return;
	}

	if (switchingDatabaseLid) {
		// Clear old game attributes from g, just to be sure
		helpers.resetG();
		await toUI("resetLeague", []);

		if (loadingNewLid !== newLid) {
			return;
		}

		// Confirm league exists before proceeding
		await getLeague(newLid);
		g.setWithoutSavingToDB("lid", newLid);
		idb.league = await connectLeague(g.get("lid"));

		if (loadingNewLid !== newLid) {
			return;
		}

		// Reuse existing cache, if it was just created while generating a new league
		// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		if (!idb.cache || !idb.cache.newLeague || switchingDatabaseLid) {
			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
			if (idb.cache) {
				idb.cache.stopAutoFlush();
			}

			idb.cache = new Cache();
			await idb.cache.fill();
			idb.cache.startAutoFlush();

			if (loadingNewLid !== newLid) {
				return;
			}
			// eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
		} else if (idb.cache && idb.cache.newLeague) {
			idb.cache.newLeague = false;
		}
	}

	await league.loadGameAttributes();
	await initUILocalGames();

	if (loadingNewLid !== newLid) {
		return;
	}

	local.leagueLoaded = true;

	await updateStatus(undefined);
	if (loadingNewLid !== newLid) {
		return;
	}
	await updatePhase(conditions);
	if (loadingNewLid !== newLid) {
		return;
	}
	await updatePlayMenu();
	if (loadingNewLid !== newLid) {
		return;
	}

	// If this is a Shared Worker, only one league can be open at a time
	if (env.useSharedWorker) {
		toUI("newLid", [g.get("lid")]);
	}
};

// beforeNonLeague runs when the user clicks a link back to the dashboard while in a league. beforeNonLeagueRunning is to handle extra realtimeUpdate request triggered by stopping gameSim in league.disconnect
let beforeNonLeagueRunning = false;
const beforeNonLeague = async (conditions: Conditions) => {
	if (!beforeNonLeagueRunning) {
		try {
			beforeNonLeagueRunning = true;
			await league.close(false);
			await toUI("resetLeague", [], conditions);

			if (!env.useSharedWorker) {
				clearInterval(heartbeatIntervalID);
			}

			beforeNonLeagueRunning = false;
		} catch (err) {
			beforeNonLeagueRunning = false;
			throw err;
		}
	}
};

export default {
	league: beforeLeague,
	nonLeague: beforeNonLeague,
};
