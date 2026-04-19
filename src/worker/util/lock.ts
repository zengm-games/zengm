import { idb } from "../db/index.ts";
import toUI from "./toUI.ts";
import type { Locks } from "../../common/types.ts";
import helpers from "./helpers.ts";

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
 * Can new game simulations be started?
 *
 * Calls the callback function with either true or false. If games are in progress or any contract negotiation is in progress, false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
const canStartGames = () => {
	if (locks.newPhase) {
		return false;
	}

	if (locks.gameSim) {
		return false;
	}

	// Otherwise, doing it outside of this function would be a race condition if anything else async happened
	set("gameSim", true);
	return true;
};

/**
 * Is there an undread message from the owner?
 *
 * Calls the callback function with either true or false.
 *
 * @memberOf util.lock
 * @return {Promise.boolean}
 */
const unreadMessage = async () => {
	const messages = await idb.getCopies.messages(
		{
			limit: 10,
		},
		"noCopyCache",
	);

	return messages.some((message) => !message.read);
};

export default {
	reset,
	get,
	set,
	canStartGames,
	unreadMessage,
};
