const g = require('./globals');
const templates = require('./templates');
const Promise = require('bluebird');
const Davis = require('./lib/davis');
const html2canvas = require('./lib/html2canvas');
const $ = require('jquery');
const ko = require('knockout');
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
    ko.applyBindings(g.vm.topMenu, document.getElementById("top-menu"));
    ko.applyBindings(g.vm.multiTeam, document.getElementById("multi-team-menu"));

    // This is messy, but it interacts with the binding in templateHelpers
    $('#multi-team-menu').on('change', '#multi-team-select', function () {
        helpers.updateMultiTeam(parseInt(this.options[this.selectedIndex].value, 10));
    });

    // Handle clicks from play menu
    const api = require("./api");
    const playMenu = $("#play-menu");
    playMenu.on("click", "#play-menu-stop", () => {
        api.play("stop");
        return false;
    });
    playMenu.on("click", "#play-menu-day", () => {
        api.play("day");
        return false;
    });
    playMenu.on("click", "#play-menu-week", () => {
        api.play("week");
        return false;
    });
    playMenu.on("click", "#play-menu-month", () => {
        api.play("month");
        return false;
    });
    playMenu.on("click", "#play-menu-until-playoffs", () => {
        api.play("untilPlayoffs");
        return false;
    });
    playMenu.on("click", "#play-menu-through-playoffs", () => {
        api.play("throughPlayoffs");
        return false;
    });
    playMenu.on("click", "#play-menu-until-draft", () => {
        api.play("untilDraft");
        return false;
    });
    playMenu.on("click", "#play-menu-until-resign-players", () => {
        api.play("untilResignPlayers");
        return false;
    });
    playMenu.on("click", "#play-menu-until-free-agency", () => {
        api.play("untilFreeAgency");
        return false;
    });
    playMenu.on("click", "#play-menu-until-preseason", () => {
        api.play("untilPreseason");
        return false;
    });
    playMenu.on("click", "#play-menu-until-regular-season", () => {
        api.play("untilRegularSeason");
        return false;
    });
    playMenu.on("click", "#play-menu-abort-phase-change", () => {
        require('./core/phase').abort();
        $("#play-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    playMenu.on("click", "#play-menu-stop-auto", () => {
        api.play("stopAutoPlay");
        return false;
    });

    // Handle clicks from Tools menu
    const toolsMenu = $("#tools-menu");
    toolsMenu.on("click", "#tools-menu-auto-play-seasons", () => {
        require('./core/league').initAutoPlay();
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    toolsMenu.on("click", "#tools-menu-skip-to-playoffs", () => {
        require('./core/phase').newPhase(g.PHASE.PLAYOFFS);
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    toolsMenu.on("click", "#tools-menu-skip-to-before-draft", () => {
        require('./core/phase').newPhase(g.PHASE.BEFORE_DRAFT);
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    toolsMenu.on("click", "#tools-menu-skip-to-after-draft", () => {
        require('./core/phase').newPhase(g.PHASE.AFTER_DRAFT);
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    toolsMenu.on("click", "#tools-menu-skip-to-preseason", () => {
        require('./core/phase').newPhase(g.PHASE.PRESEASON);
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    toolsMenu.on("click", "#tools-menu-force-resume-draft", () => {
        require('./core/draft').untilUserOrEnd();
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });
    toolsMenu.on("click", "#tools-menu-reset-db", () => {
        if (window.confirm("Are you sure you want to reset the database? This will delete all your current saved games.")) {
            require('./db').reset();
        }
        $("#tools-menu .dropdown-toggle").dropdown("toggle");
        return false;
    });

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

    // Keyboard shortcut
    const $playMenuDropdown = $("#play-menu a.dropdown-toggle");
    const playMenuOptions = document.getElementById("play-menu-options");
    document.addEventListener("keyup", e => {
        // alt + p
        if (e.altKey && e.keyCode === 80) {
            // ul -> first li -> a -> click
            playMenuOptions.firstElementChild.firstElementChild.click();

            // If play menu is open, close it
            if (playMenuOptions.parentElement.classList.contains("open")) {
                $playMenuDropdown.dropdown("toggle");
            }
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
 * Updates the title.
 * @param {string} text New title.
 */
function title(text) {
    if (g.lid !== null) {
        text += ` - ${g.leagueName}`;
    }
    document.title = `${text} - Basketball GM`;
}

/**
 * Replaces the displayed HTML content.
 *
 * After this is called, ko.applyBindings probably needs to be called to hook up Knockout.
 *
 * @memberOf ui
 * @param  {Object} data An object with several properties: "template" the name of the HTML template file in the templates folder; "container" is the id of the container div (probably content or league_content).
 */
function update(data, react = false) {
    const rendered = templates[data.template];
    const containerEl = document.getElementById(data.container);
    if (!react) {
        containerEl.innerHTML = rendered;
    }

    containerEl.dataset.idLoaded = data.template;
    containerEl.dataset.reactFirstRun = 'false';
}

function tableClickableRows(tableEl) {
    tableEl.addClass("table-hover");
    tableEl.on("click", "tbody tr", event => {
        // Toggle highlight
        if (event.currentTarget.classList.contains("warning")) {
            event.currentTarget.classList.remove("warning");
        } else {
            event.currentTarget.classList.add("warning");
        }
    });
}

// For dropdown menus to change team/season/whatever
// This should be cleaned up, but it works for now.
function dropdown(select1, select2, select3, select4) {
    const handleDropdown = select => {
        select.off("change");
        select.change(() => {
            // UGLY HACK: Stop event handling if it looks like this is a season dropdown and a new season is starting. Otherwise you get double refreshes, often pointing to the previous year, since updating the season dropdown is interpreted as a "change"
            const seasonsDropdown = document.querySelector(".bbgm-dropdown .seasons");
            if (seasonsDropdown && parseInt(seasonsDropdown.lastChild.value, 10) < g.season) {
                return;
            }

            const extraParam = select.parent()[0].dataset.extraParam;

            // Name of the page (like "standings"), with # and ? stuff removed
            const leaguePage = document.URL.split("/", 6)[5].split("#")[0].split("?")[0];

            const args = [leaguePage, select1.val()];
            if (select2 !== undefined) {
                args.push(select2.val());
            }
            if (select3 !== undefined) {
                args.push(select3.val());
            }
            if (select4 !== undefined) {
                args.push(select4.val());
            }
            let url = helpers.leagueUrl(args);

            if (extraParam !== undefined && extraParam !== null && extraParam !== "") {
                url += `/${extraParam}`;
            }

            realtimeUpdate([], url);
        });
    };

    handleDropdown(select1);
    if (select2 !== undefined) {
        handleDropdown(select2);
    }
    if (select3 !== undefined) {
        handleDropdown(select3);
    }
    if (select4 !== undefined) {
        handleDropdown(select4);
    }
}

/**
* Update play menu options based on game state.
*
* @memberOf ui
* @param {IDBTransaction|null} ot An IndexedDB transaction on gameAttributes, messages, and negotiations; if null is passed, then a new transaction will be used.
* @return {Promise}
*/
function updatePlayMenu(ot) {
    const allOptions = [
        {id: "play-menu-stop", url: "", label: "Stop"},
        {id: "play-menu-day", url: "", label: "One day"},
        {id: "play-menu-week", url: "", label: "One week"},
        {id: "play-menu-month", url: "", label: "One month"},
        {id: "play-menu-until-playoffs", url: "", label: "Until playoffs"},
        {id: "play-menu-through-playoffs", url: "", label: "Through playoffs"},
        {id: "play-menu-day-live", url: helpers.leagueUrl(["live"]), label: "One day (live)"},
        {id: "play-menu-until-draft", url: "", label: "Until draft"},
        {id: "play-menu-view-draft", url: helpers.leagueUrl(["draft"]), label: "View draft"},
        {id: "play-menu-until-resign-players", url: "", label: "Re-sign players with expiring contracts"},
        {id: "play-menu-until-free-agency", url: "", label: "Until free agency"},
        {id: "play-menu-until-preseason", url: "", label: "Until preseason"},
        {id: "play-menu-until-regular-season", url: "", label: "Until regular season"},
        {id: "play-menu-contract-negotiation", url: helpers.leagueUrl(["negotiation"]), label: "Continue contract negotiation"},
        {id: "play-menu-contract-negotiation-list", url: helpers.leagueUrl(["negotiation"]), label: "Continue re-signing players"},
        {id: "play-menu-message", url: helpers.leagueUrl(["message"]), label: "Read new message"},
        {id: "play-menu-new-league", url: "/new_league", label: "Try again in a new league"},
        {id: "play-menu-new-team", url: helpers.leagueUrl(["new_team"]), label: "Try again with a new team"},
        {id: "play-menu-abort-phase-change", url: "", label: "Abort"},
        {id: "play-menu-stop-auto", url: "", label: `Stop auto play (${g.autoPlaySeasons} seasons left)`},
    ];

    let keys;
    if (g.phase === g.PHASE.PRESEASON) {
        // Preseason
        keys = ["play-menu-until-regular-season"];
    } else if (g.phase === g.PHASE.REGULAR_SEASON) {
        // Regular season - pre trading deadline
        keys = ["play-menu-day", "play-menu-day-live", "play-menu-week", "play-menu-month", "play-menu-until-playoffs"];
    } else if (g.phase === g.PHASE.AFTER_TRADE_DEADLINE) {
        // Regular season - post trading deadline
        keys = ["play-menu-day", "play-menu-day-live", "play-menu-week", "play-menu-month", "play-menu-until-playoffs"];
    } else if (g.phase === g.PHASE.PLAYOFFS) {
        // Playoffs
        keys = ["play-menu-day", "play-menu-day-live", "play-menu-week", "play-menu-month", "play-menu-through-playoffs"];
    } else if (g.phase === g.PHASE.BEFORE_DRAFT) {
        // Offseason - pre draft
        keys = ["play-menu-until-draft"];
    } else if (g.phase === g.PHASE.DRAFT || g.phase === g.PHASE.FANTASY_DRAFT) {
        // Draft
        keys = ["play-menu-view-draft"];
    } else if (g.phase === g.PHASE.AFTER_DRAFT) {
        // Offseason - post draft
        keys = ["play-menu-until-resign-players"];
    } else if (g.phase === g.PHASE.RESIGN_PLAYERS) {
        // Offseason - re-sign players
        keys = ["play-menu-contract-negotiation-list", "play-menu-until-free-agency"];
    } else if (g.phase === g.PHASE.FREE_AGENCY) {
        // Offseason - free agency
        keys = ["play-menu-day", "play-menu-week", "play-menu-until-preseason"];
    }

    return Promise.all([
        lock.unreadMessage(ot),
        lock.gamesInProgress(ot),
        lock.negotiationInProgress(ot),
        lock.phaseChangeInProgress(ot),
    ]).spread((unreadMessage, gamesInProgress, negotiationInProgress, phaseChangeInProgress) => {
        if (unreadMessage) {
            keys = ["play-menu-message"];
        }
        if (gamesInProgress) {
            keys = ["play-menu-stop"];
        }
        if (negotiationInProgress && g.phase !== g.PHASE.RESIGN_PLAYERS) {
            keys = ["play-menu-contract-negotiation"];
        }
        if (phaseChangeInProgress) {
            keys = ["play-menu-abort-phase-change"];
        }

        // If there is an unread message, it's from the owner saying the player is fired, so let the user see that first.
        if (g.gameOver && !unreadMessage) {
            keys = ["play-menu-new-team", "play-menu-new-league"];
        }

        if (g.autoPlaySeasons > 0) {
            keys = ["play-menu-stop-auto"];
        }

        // This code is very ugly. Basically I just want to filter all_options into
        // some_options based on if the ID matches one of the keys.
        const ids = [];
        for (let i = 0; i < allOptions.length; i++) {
            ids.push(allOptions[i].id);
        }
        const someOptions = [];
        for (let i = 0; i < keys.length; i++) {
            for (let j = 0; j < ids.length; j++) {
                if (ids[j] === keys[i]) {
                    someOptions.push(allOptions[j]);
                    break;
                }
            }
        }

        if (someOptions.length > 0) {
            someOptions[0].label += ' <span class="text-muted kbd">Alt+P</span>';
        }

        g.vm.topMenu.options(someOptions);
    });
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
        g.vm.topMenu.statusText(oldStatus);
    } else if (statusText !== oldStatus) {
        await require('./core/league').setGameAttributesComplete({statusText});
        g.vm.topMenu.statusText(statusText);
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
        g.vm.topMenu.phaseText(oldPhaseText);
    } else if (phaseText !== oldPhaseText) {
        await require('./core/league').setGameAttributesComplete({phaseText});
        g.vm.topMenu.phaseText(phaseText);

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
    tableClickableRows,
    dropdown,
    realtimeUpdate,
    title,
    update,
    updatePhase,
    updatePlayMenu,
    updateStatus,
    highlightPlayButton,
};
