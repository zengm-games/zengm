import Promise from 'bluebird';
import page from 'page';
import g from './globals';
import * as league from './core/league';
import * as helpers from './util/helpers';
import * as lock from './util/lock';

/**
 * Smartly update the currently loaded view or redirect to a new one.
 *
 * This will only refresh or redirect to in-league URLs (and a couple out of league). Otherwise, the callback is just called immediately.
 *
 * @memberOf ui
 * @param {Array.<string>=} updateEvents Optional array of strings containing information about what caused this update, e.g. "gameSim" or "playerMovement".
 * @param {string=} url Optional URL to redirect to. The current URL is used if this is not defined. If this URL is either undefined or the same as location.pathname, it is considered to be an "refresh" and no entry in the history or stat tracker is made. Otherwise, it's considered to be a new pageview.
 * @param {function()=} cb Optional callback that will run after the page updates.
 * @param {Object=} raw Optional object passed through to the page.js request context's bbgm property.
 */
function realtimeUpdate(updateEvents = [], url, cb, raw = {}) {
    url = url !== undefined ? url : location.pathname + location.search;

    const inLeague = url.substr(0, 3) === "/l/"; // Check the URL to be redirected to, not the current league (g.lid)
    const refresh = url === location.pathname && inLeague;

    const ctx = new page.Context(url);
    for (const key of Object.keys(raw)) {
        ctx[key] = raw[key];
    }
    ctx.updateEvents = updateEvents;
    ctx.cb = cb;
    if (refresh) {
        ctx.noTrack = true;
    }
    page.current = ctx.path;

    // This prevents the Create New League form from inappropriately refreshing after it is submitted
    if (refresh) {
        page.dispatch(ctx);
    } else if (inLeague || url === "/" || url.indexOf("/account") === 0) {
        page.dispatch(ctx);
        if (ctx.handled) {
            ctx.pushState();
        }
    } else if (cb !== undefined) {
        cb();
    }
}

/**
* Update play menu options based on game state.
*
* @memberOf ui
* @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes, messages, and negotiations; if null is passed, then a new transaction will be used.
* @return {Promise}
*/
async function updatePlayMenu(ot) {
    const allOptions = {
        stop: {label: "Stop"},
        day: {label: "One day"},
        week: {label: "One week"},
        month: {label: "One month"},
        untilPlayoffs: {label: "Until playoffs"},
        throughPlayoffs: {label: "Through playoffs"},
        dayLive: {url: helpers.leagueUrl(["live"]), label: "One day (live)"},
        untilDraft: {label: "Until draft"},
        viewDraft: {url: helpers.leagueUrl(["draft"]), label: "View draft"},
        untilResignPlayers: {label: "Re-sign players with expiring contracts"},
        untilFreeAgency: {label: "Until free agency"},
        untilPreseason: {label: "Until preseason"},
        untilRegularSeason: {label: "Until regular season"},
        contractNegotiation: {url: helpers.leagueUrl(["negotiation"]), label: "Continue contract negotiation"},
        contractNegotiationList: {url: helpers.leagueUrl(["negotiation"]), label: "Continue re-signing players"},
        message: {url: helpers.leagueUrl(["message"]), label: "Read new message"},
        newLeague: {url: "/new_league", label: "Try again in a new league"},
        newTeam: {url: helpers.leagueUrl(["new_team"]), label: "Try again with a new team"},
        abortPhaseChange: {label: "Abort"},
        stopAuto: {label: `Stop auto play (${g.autoPlaySeasons} seasons left)`},
    };

    let keys;
    if (g.phase === g.PHASE.PRESEASON) {
        // Preseason
        keys = ["untilRegularSeason"];
    } else if (g.phase === g.PHASE.REGULAR_SEASON) {
        // Regular season - pre trading deadline
        keys = ["day", "dayLive", "week", "month", "untilPlayoffs"];
    } else if (g.phase === g.PHASE.AFTER_TRADE_DEADLINE) {
        // Regular season - post trading deadline
        keys = ["day", "dayLive", "week", "month", "untilPlayoffs"];
    } else if (g.phase === g.PHASE.PLAYOFFS) {
        // Playoffs
        keys = ["day", "dayLive", "week", "month", "throughPlayoffs"];
    } else if (g.phase === g.PHASE.BEFORE_DRAFT) {
        // Offseason - pre draft
        keys = ["untilDraft"];
    } else if (g.phase === g.PHASE.DRAFT || g.phase === g.PHASE.FANTASY_DRAFT) {
        // Draft
        keys = ["viewDraft"];
    } else if (g.phase === g.PHASE.AFTER_DRAFT) {
        // Offseason - post draft
        keys = ["untilResignPlayers"];
    } else if (g.phase === g.PHASE.RESIGN_PLAYERS) {
        // Offseason - re-sign players
        keys = ["contractNegotiationList", "untilFreeAgency"];
    } else if (g.phase === g.PHASE.FREE_AGENCY) {
        // Offseason - free agency
        keys = ["day", "week", "untilPreseason"];
    }

    const [unreadMessage, gamesInProgress, negotiationInProgress, phaseChangeInProgress] = await Promise.all([
        lock.unreadMessage(ot),
        lock.gamesInProgress(ot),
        lock.negotiationInProgress(ot),
        lock.phaseChangeInProgress(ot),
    ]);

    if (unreadMessage) {
        keys = ["message"];
    }
    if (gamesInProgress) {
        keys = ["stop"];
    }
    if (negotiationInProgress && g.phase !== g.PHASE.RESIGN_PLAYERS) {
        keys = ["contractNegotiation"];
    }
    if (phaseChangeInProgress) {
        keys = ["abortPhaseChange"];
    }

    // If there is an unread message, it's from the owner saying the player is fired, so let the user see that first.
    if (g.gameOver && !unreadMessage) {
        keys = ["newTeam", "newLeague"];
    }

    if (g.autoPlaySeasons > 0) {
        keys = ["stopAuto"];
    }

    const someOptions = keys.map(id => {
        allOptions[id].id = id;
        return allOptions[id];
    });

    g.emitter.emit('updateTopMenu', {options: someOptions});
}

/*Save status to database and push to client.

If no status is given, load the last status from the database and push that
to the client.

Args:
    status: A string containing the current status message to be pushed to
        the client.
*/
async function updateStatus(statusText) {
    const oldStatus = g.statusText;
    if (statusText === undefined) {
        g.emitter.emit('updateTopMenu', {statusText: oldStatus});
    } else if (statusText !== oldStatus) {
        await league.setGameAttributesComplete({statusText});
        g.emitter.emit('updateTopMenu', {statusText});
    }
}

/*Save phase text to database and push to client.

If no phase text is given, load the last phase text from the database and
push that to the client.

Args:
    phaseText: A string containing the current phase text to be pushed to
        the client.
*/
async function updatePhase(phaseText) {
    const oldPhaseText = g.phaseText;
    if (phaseText === undefined) {
        g.emitter.emit('updateTopMenu', {phaseText: oldPhaseText});
    } else if (phaseText !== oldPhaseText) {
        await league.setGameAttributesComplete({phaseText});
        g.emitter.emit('updateTopMenu', {phaseText});

        // Update phase in meta database. No need to have this block updating the UI or anything.
        const l = await g.dbm.leagues.get(g.lid);
        l.phaseText = phaseText;
        await g.dbm.leagues.put(l);
    }
}

export {
    realtimeUpdate,
    updatePhase,
    updatePlayMenu,
    updateStatus,
};
