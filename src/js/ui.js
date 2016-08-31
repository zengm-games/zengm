const g = require('./globals');
const Promise = require('bluebird');
const React = require('react');
const ReactDOM = require('react-dom');
const Davis = require('./lib/davis');
const html2canvas = require('./lib/html2canvas');
const $ = require('jquery');
const helpers = require('./util/helpers');
const lock = require('./util/lock');

/**
 * Smartly update the currently loaded view or redirect to a new one.
 *
 * This will only refresh or redirect to in-league URLs (and a couple out of league). Otherwise, the callback is just called immediately.
 *
 * @memberOf ui
 * @param {Array.<string>=} updateEvents Optional array of strings containing information about what caused this update, e.g. "gameSim" or "playerMovement".
 * @param {string=} url Optional URL to redirect to. The current URL is used if this is not defined. If this URL is either undefined or the same as location.pathname, it is considered to be an "refresh" and no entry in the history or stat tracker is made. Otherwise, it's considered to be a new pageview.
 * @param {function()=} cb Optional callback that will run after the page updates.
 * @param {Object=} raw Optional object passed through to Davis's req.raw.
 */
function realtimeUpdate(updateEvents = [], url, cb, raw = {}) {
    url = url !== undefined ? url : location.pathname + location.search;

    const inLeague = url.substr(0, 3) === "/l/"; // Check the URL to be redirected to, not the current league (g.lid)
    const refresh = url === location.pathname && inLeague;

    // If tracking is enabled, don't track realtime updates for refreshes
    if (Davis.Request.prototype.noTrack !== undefined && refresh) {
        Davis.Request.prototype.noTrack();
    }

    raw.updateEvents = updateEvents;
    raw.cb = cb;

    // This prevents the Create New League form from inappropriately refreshing after it is submitted
    if (refresh) {
        Davis.location.replace(new Davis.Request(url, raw));
    } else if (inLeague || url === "/" || url.indexOf("/account") === 0) {
        Davis.location.assign(new Davis.Request(url, raw));
    } else if (cb !== undefined) {
        cb();
    }
}

// Things to do on initial page load
function init() {
    const {Controller} = require('./views/components');
    ReactDOM.render(<Controller />, document.getElementById('content'));

    // Bootstrap's collapsable nav doesn't play nice with single page apps
    // unless you manually close it when a link is clicked. However, I need
    // this to run only on real links, not "dropdown" links (#).
    const topMenuCollapse = $("#top-menu-collapse");
    topMenuCollapse.on("click", "a:not([href='#'])", () => {
        // Only run when collapsable is open
        if (topMenuCollapse.hasClass("in")) {
            topMenuCollapse.collapse("hide");
        }
    });

    // When a dropdown at the top is open, use hover to move between items,
    // like in a normal menubar.
    $("#nav-primary .dropdown-toggle").on("mouseenter", event => {
        if (!topMenuCollapse.hasClass("in")) {
            const liHover = event.target.parentNode;

            // Is any dropdown open?
            let foundOpen = false;
            const lis = document.getElementById("nav-primary").children;
            for (let i = 0; i < lis.length; i++) {
                if (lis[i].classList.contains("open")) {
                    foundOpen = true;
                    if (lis[i] === liHover) {
                        // The hovered menu is already open
                        return;
                    }
                }
            }

            // If no dropdown is open, do nothing
            if (!foundOpen) {
                return;
            }

            // If a dropdown is open and another one is hovered over, open the hovered one and close the other
            $(liHover.children[0]).dropdown("toggle");
        }
    });

    // Watch list toggle
    $(document).on("click", ".watch", async event => {
        const watchEl = event.target;
        const pid = parseInt(watchEl.dataset.pid, 10);

        await g.dbl.tx("players", "readwrite", async tx => {
            const p = await tx.players.get(pid);
            if (watchEl.classList.contains("watch-active")) {
                p.watch = false;
                watchEl.classList.remove("watch-active");
                watchEl.title = "Add to Watch List";
            } else {
                p.watch = true;
                watchEl.classList.add("watch-active");
                watchEl.title = "Remove from Watch List";
            }
            await tx.players.put(p);
        });

        require('./core/league').updateLastDbChange();
        realtimeUpdate(["watchList"]);
    });

    const screenshotEl = document.getElementById("screenshot");
    if (screenshotEl) { // Some errors were showing up otherwise for people with stale index.html maybe
        screenshotEl.addEventListener("click", event => {
            event.preventDefault();

            let contentEl = document.getElementById("league_content");
            if (!contentEl) { contentEl = document.getElementById("content"); }

            // Add watermark
            const watermark = document.createElement("div");
            watermark.innerHTML = `<nav class="navbar navbar-default"><div class="container-fluid"><div class="navbar-header">${document.getElementsByClassName("navbar-brand")[0].parentNode.innerHTML}</div><p class="navbar-text navbar-right" style="color: #000; font-weight: bold">Play your own league free at basketball-gm.com</p></div></nav>`;
            contentEl.insertBefore(watermark, contentEl.firstChild);
            contentEl.style.padding = "8px";

            // Add notifications
            const notifications = document.getElementsByClassName('notification-container')[0].cloneNode(true);
            notifications.classList.remove('notification-container');
            for (let i = 0; i < notifications.childNodes.length; i++) {
                // Otherwise screeenshot is taken before fade in is complete
                notifications.childNodes[0].classList.remove('notification-fadein');
            }
            contentEl.appendChild(notifications);

            html2canvas(contentEl, {
                background: "#fff",
                async onrendered(canvas) {
                    // Remove watermark
                    contentEl.removeChild(watermark);
                    contentEl.style.padding = "";

                    // Remove notifications
                    contentEl.removeChild(notifications);

                    try {
                        const data = await Promise.resolve($.ajax({
                            url: "https://imgur-apiv3.p.mashape.com/3/image",
                            type: "post",
                            headers: {
                                Authorization: "Client-ID c2593243d3ea679",
                                "X-Mashape-Key": "H6XlGK0RRnmshCkkElumAWvWjiBLp1ItTOBjsncst1BaYKMS8H",
                            },
                            data: {
                                image: canvas.toDataURL().split(',')[1],
                            },
                            dataType: "json",
                        }));
                        document.getElementById("screenshot-link").href = `http://imgur.com/${data.data.id}`;
                        $("#modal-screenshot").modal("show");
                    } catch (err) {
                        console.log(err);
                        if (err && err.responseJSON && err.responseJSON.error && err.responseJSON.error.message) {
                            helpers.errorNotify(`Error saving screenshot. Error message from Imgur: "${err.responseJSON.error.message}"`);
                        } else {
                            helpers.errorNotify("Error saving screenshot.");
                        }
                    }
                },
            });
        });
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
        return {id, ...allOptions[id]};
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
        await require('./core/league').setGameAttributesComplete({statusText});
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
        await require('./core/league').setGameAttributesComplete({phaseText});
        g.emitter.emit('updateTopMenu', {phaseText});

        // Update phase in meta database. No need to have this block updating the UI or anything.
        const l = await g.dbm.leagues.get(g.lid);
        l.phaseText = phaseText;
        await g.dbm.leagues.put(l);
    }
}

function highlightPlayButton() {
    const playButtonLink = $("#play-button-link");

    playButtonLink.popover({
        trigger: "manual",
        placement: "bottom",
        title: "Welcome to Basketball GM!",
        content: "To advance through the game, use the Play button at the top. The options shown will change depending on the current state of the game.",
        template: '<div class="popover popover-play"><div class="arrow"></div><h3 class="popover-title"></h3><div class="popover-content"></div></div>',
    });

    // If the user finds the play button first, don't show the popover
    playButtonLink.on("click", () => {
        playButtonLink.popover("hide");
    });

    setTimeout(() => {
        playButtonLink.popover("show");

        // Only do this after showing button, so a quick click doesn't close it early
        $(document).on("click", () => {
            playButtonLink.popover("hide");
        });
    }, 1000);
}

module.exports = {
    init,
    realtimeUpdate,
    updatePhase,
    updatePlayMenu,
    updateStatus,
    highlightPlayButton,
};
