import { PHASE } from "../../../common/index.ts";
import { league } from "../index.ts";
import { idb } from "../../db/index.ts";
import {
	local,
	lock,
	toUI,
	updatePhase,
	updatePlayMenu,
	updateStatus,
	processScheduledEvents,
	g,
	getGlobalSettings,
	logEvent,
} from "../../util/index.ts";
import type { Conditions, Phase, PhaseReturn } from "../../../common/types.ts";

/**
 * Common tasks run after a new phrase is set.
 *
 * This updates the phase, executes a callback, and (if necessary) updates the UI. It should only be called from one of the NewPhase* functions defined below.
 *
 * @memberOf core.phase
 * @param {number} phase Integer representing the new phase of the game (see other functions in this module).
 * @param {string=} url Optional URL to pass to api.realtimeUpdate for redirecting on new phase. If undefined, then the current page will just be refreshed.
 * @param {Array.<string>=} updateEvents Array of strings.
 * @return {Promise}
 */
const finalize = async (
	phase: Phase,
	conditions: Conditions,
	{ redirect, updateEvents = [] }: PhaseReturn,
) => {
	await updateStatus("Saving...");

	// Set phase before saving to database
	await league.setGameAttributes({
		phase,
	});

	// Fill only in preseason, because not much changes before then
	await idb.cache.flush();

	if (phase === PHASE.PRESEASON) {
		await idb.cache.fill();
	}

	await lock.set("newPhase", false);
	await updatePhase();
	await updatePlayMenu();
	await updateStatus();
	updateEvents.push("newPhase");

	if (
		phase === PHASE.PRESEASON ||
		phase === PHASE.DRAFT_LOTTERY ||
		phase === PHASE.FREE_AGENCY
	) {
		// Needs to be here rather than in newPhasePreseason so g.season is set correctly and wrapped game attributes will therefore update correctly.
		await processScheduledEvents(g.get("season"), phase, conditions);
	}

	// Redirect if no auto play and if the user wants this redirect
	let redirectToNewURL = false;
	if (redirect !== undefined && !local.autoPlayUntil) {
		const globalSettings = await getGlobalSettings();

		if (globalSettings.phaseChangeRedirects.includes(phase)) {
			redirectToNewURL = true;
		}
	}

	// await is needed on these toUI calls, otherwise when auto playing two quick phase updates could happen in a row, and then the worker view might not be called until the phase has advanced twice, and then some updateEvents checks for a specific newPhase phase might be missed
	if (redirectToNewURL && redirect !== undefined) {
		await toUI("realtimeUpdate", [updateEvents, redirect.url], conditions);
		// This will refresh the url above inadvertently, because there is no way currently to say "refresh tabs except the one in conditions"
		await toUI("realtimeUpdate", [updateEvents]);
	} else {
		await toUI("realtimeUpdate", [updateEvents]);

		if (redirect !== undefined && !local.autoPlayUntil) {
			await logEvent({
				type: "info",
				text: `<a href="${redirect.url}">${redirect.text}</a>`,
				saveToDb: false,
			});
		}
	}

	if (local.autoPlayUntil) {
		await league.autoPlay(conditions);
	}
};

export default finalize;
