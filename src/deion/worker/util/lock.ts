import { idb } from "../db";
import toUI from "./toUI";
import type { Locks } from "../../common/types";
import { helpers } from "../../common";

// These are transient variables that always reset to "false" on reload. See local.js for more.
const locks: Locks = {
	drafting: false,
	gameSim: false,
	newPhase: false,
	stopGameSim: false,
};

const reset = () => {
	for (const key of helpers.keys(locks)) {
		locks[key] = false;
	}
};

const get = (name: keyof Locks): boolean => {
	return locks[name];
};

const set = async (name: keyof Locks, value: boolean) => {
	if (locks[name] === value) {
		// Short circuit to prevent realtimeUpdate
		return;
	}

	locks[name] = value;

	if (name === "gameSim") {
		await toUI("updateLocal", [
			{
				gameSimInProgress: value,
			},
		]);
	}
};

/**
 * Is a negotiation in progress?
 *
 * Calls the callback function with either true or false depending on whether there is an ongoing negoation.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function negotiationInProgress(): Promise<boolean> {
	const negotiations = await idb.cache.negotiations.getAll();
	return negotiations.length > 0;
}

/**
 * Can new game simulations be started?
 *
 * Calls the callback function with either true or false. If games are in progress or any contract negotiation is in progress, false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function canStartGames(): Promise<boolean> {
	const negotiationInProgressBool = await negotiationInProgress();

	if (negotiationInProgressBool) {
		return false;
	}

	if (locks.newPhase) {
		return false;
	}

	if (locks.gameSim) {
		return false;
	}

	// Otherwise, doing it outside of this function would be a race condition if anything else async happened
	set("gameSim", true);
	return true;
}

/**
 * Is there an undread message from the owner?
 *
 * Calls the callback function with either true or false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
async function unreadMessage(): Promise<boolean> {
	const messages = await idb.getCopies.messages({
		limit: 10,
	});

	for (let i = 0; i < messages.length; i++) {
		if (!messages[i].read) {
			return true;
		}
	}

	return false;
}

export default {
	reset,
	get,
	set,
	negotiationInProgress,
	canStartGames,
	unreadMessage,
};
