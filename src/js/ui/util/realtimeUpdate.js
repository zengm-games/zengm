// @flow

import page from "page";
import type { UpdateEvents } from "../../common/types";

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
async function realtimeUpdate(
    updateEvents: UpdateEvents = [],
    url?: string,
    raw?: Object = {},
) {
    return new Promise(resolve => {
        url =
            url !== undefined
                ? url
                : window.location.pathname + window.location.search;

        const inLeague = url.substr(0, 3) === "/l/";
        const refresh = url === window.location.pathname && inLeague;

        const ctx = new page.Context(url);
        ctx.bbgm = {};
        for (const key of Object.keys(raw)) {
            ctx.bbgm[key] = raw[key];
        }
        ctx.bbgm.updateEvents = updateEvents;
        ctx.bbgm.cb = () => resolve();
        if (refresh) {
            ctx.bbgm.noTrack = true;
        }
        page.current = ctx.path;

        // This prevents the Create New League form from inappropriately refreshing after it is submitted
        if (refresh) {
            page.dispatch(ctx);
        } else if (inLeague || url === "/" || url.indexOf("/account") === 0) {
            page.dispatch(ctx);
            ctx.pushState();
        } else {
            resolve();
        }
    });
}

export default realtimeUpdate;
