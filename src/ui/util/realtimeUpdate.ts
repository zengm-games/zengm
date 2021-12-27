import type { UpdateEvents } from "../../common/types";
import { viewManager } from "./viewManager";

/**
 * Smartly update the currently loaded view or redirect to a new one.
 *
 * This will only refresh or redirect to in-league URLs (and a couple out of league). Otherwise, the callback is just called immediately.
 *
 * @memberOf ui
 * @param {Array.<string>=} updateEvents Optional array of strings containing information about what caused this update, e.g. "gameSim" or "playerMovement".
 * @param {string=} url Optional URL to redirect to. The current URL is used if this is not defined. If this URL is either undefined or the same as location.pathname, it is considered to be an "refresh" and no entry in the history or stat tracker is made. Otherwise, it's considered to be a new pageview.
 * @param {Object=} raw Optional object passed through to the page.js request context's bbgm property.
 */
const realtimeUpdate = async (
	updateEvents: UpdateEvents = [],
	url?: string,
	raw?: Record<string, unknown>,
	replace?: boolean,
) => {
	const urlTemp = url ?? window.location.pathname + window.location.search;
	const inLeague = urlTemp.substr(0, 3) === "/l/";
	const refresh = urlTemp === window.location.pathname && inLeague;

	await viewManager.fromRealtimeUpdate({
		url,
		refresh,
		replace,
		updateEvents,
		raw,
	});
};

export default realtimeUpdate;
