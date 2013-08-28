/**
 * @name ui
 * @namespace Anything that directly updates the UI.
 */
define(["db", "globals", "templates", "lib/davis", "lib/jquery", "lib/knockout", "util/helpers", "util/lock"], function (db, g, templates, Davis, $, ko, helpers, lock) {
    "use strict";

    // Things to do on initial page load
    function init() {
        var api, slideOut;

        // "Feedback" slider
        slideOut = $(".slide-out");
        if (slideOut.length > 0) {
            slideOut.css({
                visibility: "visible"
            }).tabSlideOut({
                tabHandle: ".slide-out-handle",
                rightPos: "20px"
            });
        }

        ko.applyBindings(g.vm.playMenu, document.getElementById("play-menu"));

        // Handle clicks from play menu
        api = require("api");
        $("#play-menu").on("click", "#play-menu-stop", function () {
            api.play("stop");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-day", function () {
            api.play("day");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-week", function () {
            api.play("week");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-month", function () {
            api.play("month");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-until-playoffs", function () {
            api.play("untilPlayoffs");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-through-playoffs", function () {
            api.play("throughPlayoffs");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-until-draft", function () {
            api.play("untilDraft");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-until-resign-players", function () {
            api.play("untilResignPlayers");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-until-free-agency", function () {
            api.play("untilFreeAgency");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-until-preseason", function () {
            api.play("untilPreseason");
            return false;
        });
        $("#play-menu").on("click", "#play-menu-until-regular-season", function () {
            api.play("untilRegularSeason");
            return false;
        });
    }

    function highlightNav(leaguePage) {
        if (leaguePage === "") {
            leaguePage = "league_dashboard";
        } else if (leaguePage === "draft_summary") {
            leaguePage = "draft";
        }
        $("#league-menu li").removeClass("active");
        $("#nav_" + leaguePage).addClass("active");
    }

    function parseLeagueUrl(url) {
        var league_id, league_page, league_root_url, split_url;
        // Returns a list containing the integer league ID (0 if none), the
        // league root URL up to the league ID (empty string if none), and the
        // league page (first URL folder after the ID) (empty string if none).

        league_id = 0;
        league_root_url = "";
        league_page = "";

        split_url = url.split("/", 6);

        // If there's a URL that starts http://domain.com/l/<int:league_id>,
        // split_url will have length 4 or 5, depending on if there is a page after
        // the league ID.

        if (split_url.length >= 5) {
            league_id = parseInt(split_url[4], 10);
            league_root_url = split_url.slice(0, 5).join("/");
        }
        if (split_url.length === 6) {
            // Get rid of any trailing # or ?
            league_page = split_url[5].split("#")[0];
            league_page = split_url[5].split("?")[0];
        }

        return [league_id, league_root_url, league_page];
    }

    /**
     * Updates the title.
     * @param {string} text New title.
     */
    function title(text) {
        if (g.lid !== null) {
            text += " - " + g.leagueName;
        }
        document.title = text + " - Basketball GM";
    }

    /**
     * Replaces the displayed HTML content.
     *
     * After this is called, ko.applyBindings probably needs to be called to hook up Knockout.
     *
     * @memberOf ui
     * @param  {Object} data An object with several properties: "template" the name of the HTML template file in the templates folder; "container" is the id of the container div (probably content or league_content).
     */
    function update(data) {
        var containerEl, contentEl, leaguePage, rendered, result;

        rendered = templates[data.template];
        containerEl = document.getElementById(data.container);
        containerEl.innerHTML = rendered;

        result = parseLeagueUrl(document.URL);
        leaguePage = result[2];
        highlightNav(leaguePage);

        if (data.container === "league_content") {
            contentEl = document.getElementById("content");
            if (contentEl) {
                contentEl.dataset.idLoaded = "league";
                contentEl.dataset.idLoading = "";
            }
        }
        containerEl.dataset.idLoaded = data.template;
    }

    /**
     * Smartly update the currently loaded view or redirect to a new one.
     *
     * This will only refresh or redirect to in-league URLs. Otherwise, the callback is just called immediately.
     *
     * @memberOf ui
     * @param {Array.<string>=} updateEvents Optional array of strings containing information about what caused this update, e.g. "gameSim" or "playerMovement".
     * @param {string=} url Optional URL to redirect to. The current URL is used if this is not defined. If this URL is either undefined or the same as location.pathname, it is considered to be an "refresh" and no entry in the history or stat tracker is made. Otherwise, it's considered to be a new pageview.
     * @param {function()=} cb Optional callback that will run after the page updates.
     * @param {Object=} raw Optional object passed through to Davis's req.raw.
     */
    function realtimeUpdate(updateEvents, url, cb, raw) {
        var inLeague, refresh;

        updateEvents = updateEvents !== undefined ? updateEvents : [];
        url = url !== undefined ? url : location.pathname + location.search;
        raw = raw !== undefined ? raw : {};

        inLeague = url.substr(0, 3) === "/l/"; // Check the URL to be redirected to, not the current league (g.lid)
        refresh = url === location.pathname && inLeague;

        // If tracking is enabled, don't track realtime updates for refreshes
        if (Davis.Request.prototype.noTrack !== undefined && refresh) {
            Davis.Request.prototype.noTrack();
        }

        raw.updateEvents = updateEvents;
        raw.cb = cb;

        // This prevents the Create New League form from inappropriately refreshing after it is submitted
        if (refresh) {
            Davis.location.replace(new Davis.Request(url, raw));
        } else if (inLeague || url === "/") {
            Davis.location.assign(new Davis.Request(url, raw));
        } else if (cb !== undefined) {
            cb();
        }
    }

    // Data tables
    // fnStateSave and fnStateLoad are based on http://www.datatables.net/blog/localStorage_for_state_saving except the id of the table is used in the key. This means that whatever you do to a table (sorting, viewing page, etc) will apply to every identical table in other leagues.
    function datatable(table, sort_col, data, extraOptions) {
        var options;

        options = $.extend({
            aaData: data,
            aaSorting: [[sort_col, "desc"]],
            bDestroy: true,
            bDeferRender: true,
            bStateSave: true,
            fnStateSave: function (oSettings, oData) {
                localStorage.setItem("DataTables_" + table[0].id, JSON.stringify(oData));
            },
            fnStateLoad: function (oSettings) {
                return JSON.parse(localStorage.getItem("DataTables_" + table[0].id));
            },
            sPaginationType: "bootstrap",
            oLanguage: {
                sLengthMenu: "_MENU_ players per page",
                sInfo: "Showing _START_ to _END_ of _TOTAL_ players",
                sInfoEmpty: "Showing 0 to 0 of 0 players",
                sInfoFiltered: "(filtered from _MAX_ total players)"
            }
        }, extraOptions);

        table.dataTable(options);
    }
    function datatableSinglePage(table, sort_col, data, extraOptions) {
        var options;

        options = $.extend({
            aaData: data,
            aaSorting: [[sort_col, "desc"]],
            bDestroy: true,
            bFilter: false,
            bInfo: false,
            bPaginate: false,
            bStateSave: true,
            fnStateSave: function (oSettings, oData) {
                localStorage.setItem("DataTables_" + table[0].id, JSON.stringify(oData));
            },
            fnStateLoad: function (oSettings) {
                return JSON.parse(localStorage.getItem("DataTables_" + table[0].id));
            }
        }, extraOptions);

        table.dataTable(options);
    }

    // For dropdown menus to change team/season/whatever
    // This should be cleaned up, but it works for now.
    function dropdown(select1, select2) {
        if (arguments.length === 1) {
            select1.off("change");
            select1.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = helpers.leagueUrl([league_page, select1.val()]);
                realtimeUpdate([], url);
            });
        } else if (arguments.length >= 2) {
            select1.off("change");
            select1.change(function (event) {
                var extraParam, league_page, league_root_url, result, url;

                extraParam = select1.parent()[0].dataset.extraParam;
                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = helpers.leagueUrl([league_page, select1.val(), select2.val()]);
                if (extraParam !== undefined && extraParam !== null && extraParam !== "") {
                    url += "/" + extraParam;
                }
                realtimeUpdate([], url);
            });
            select2.off("change");
            select2.change(function (event) {
                var extraParam, league_page, league_root_url, result, url;

                extraParam = select2.parent()[0].dataset.extraParam;
                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = helpers.leagueUrl([league_page, select1.val(), select2.val()]);
                if (extraParam !== undefined && extraParam !== null && extraParam !== "") {
                    url += "/" + extraParam;
                }
                realtimeUpdate([], url);
            });
        }
    }

    /*Get current options based on game state and push rendered play button
    to client. ot is passed on to the lock functions.
    */
    function updatePlayMenu(ot, cb) {
        var allOptions, keys;

        allOptions = [{id: "play-menu-stop", url: "", label: "Stop"},
                      {id: "play-menu-day", url: "", label: "One day"},
                      {id: "play-menu-week", url: "", label: "One week"},
                      {id: "play-menu-month", url: "", label: "One month"},
                      {id: "play-menu-until-playoffs", url: "", label: "Until playoffs"},
                      {id: "play-menu-through-playoffs", url: "", label: "Through playoffs"},
                      {id: "play-menu-until-draft", url: "", label: "Until draft"},
                      {id: "play-menu-view-draft", url: helpers.leagueUrl(["draft"]), label: "View draft"},
                      {id: "play-menu-until-resign-players", url: "", label: "Resign players with expiring contracts"},
                      {id: "play-menu-until-free-agency", url: "", label: "Until free agency"},
                      {id: "play-menu-until-preseason", url: "", label: "Until preseason"},
                      {id: "play-menu-until-regular-season", url: "", label: "Until regular season"},
                      {id: "play-menu-contract-negotiation", url: helpers.leagueUrl(["negotiation"]), label: "Continue contract negotiation"},
                      {id: "play-menu-contract-negotiation-list", url: helpers.leagueUrl(["negotiation"]), label: "Continue resigning players"},
                      {id: "play-menu-message", url: helpers.leagueUrl(["message"]), label: "Read new message"},
                      {id: "play-menu-new-league", url: "/new_league", label: "Try again in a new league"},
                      {id: "play-menu-new-team", url: helpers.leagueUrl(["new_team"]), label: "Try again with a new team"}];

        if (g.phase === g.PHASE.PRESEASON) {
            // Preseason
            keys = ["play-menu-until-regular-season"];
        } else if (g.phase === g.PHASE.REGULAR_SEASON) {
            // Regular season - pre trading deadline
            keys = ["play-menu-day", "play-menu-week", "play-menu-month", "play-menu-until-playoffs"];
        } else if (g.phase === g.PHASE.AFTER_TRADE_DEADLINE) {
            // Regular season - post trading deadline
            keys = ["play-menu-day", "play-menu-week", "play-menu-month", "play-menu-until-playoffs"];
        } else if (g.phase === g.PHASE.PLAYOFFS) {
            // Playoffs
            keys = ["play-menu-day", "play-menu-week", "play-menu-month", "play-menu-through-playoffs"];
        } else if (g.phase === g.PHASE.BEFORE_DRAFT) {
            // Offseason - pre draft
            keys = ["play-menu-until-draft"];
        } else if (g.phase === g.PHASE.DRAFT) {
            // Draft
            keys = ["play-menu-view-draft"];
        } else if (g.phase === g.PHASE.AFTER_DRAFT) {
            // Offseason - post draft
            keys = ["play-menu-until-resign-players"];
        } else if (g.phase === g.PHASE.RESIGN_PLAYERS) {
            // Offseason - resign players
            keys = ["play-menu-contract-negotiation-list", "play-menu-until-free-agency"];
        } else if (g.phase === g.PHASE.FREE_AGENCY) {
            // Offseason - free agency
            keys = ["play-menu-until-preseason"];
        }

        lock.unreadMessage(ot, function (unreadMessage) {
            if (unreadMessage) {
                keys = ["play-menu-message"];
            }

            lock.gamesInProgress(ot, function (gamesInProgress) {
                if (gamesInProgress) {
                    keys = ["play-menu-stop"];
                }

                lock.negotiationInProgress(ot, function (negotiationInProgress) {
                    var i, ids, j, playButtonElement, someOptions;

                    if (negotiationInProgress && g.phase !== g.PHASE.RESIGN_PLAYERS) {
                        keys = ["play-menu-contract-negotiation"];
                    }

                    // If there is an unread message, it's from the owner saying the player is fired, so let the user see that first.
                    if (g.gameOver && !unreadMessage) {
                        keys = ["play-menu-new-team", "play-menu-new-league"];
                    }

                    // This code is very ugly. Basically I just want to filter all_options into
                    // some_options based on if the ID matches one of the keys.
                    ids = [];
                    for (i = 0; i < allOptions.length; i++) {
                        ids.push(allOptions[i].id);
                    }
                    someOptions = [];
                    for (i = 0; i < keys.length; i++) {
                        for (j = 0; j < ids.length; j++) {
                            if (ids[j] === keys[i]) {
                                someOptions.push(allOptions[j]);
                                break;
                            }
                        }
                    }

                    g.vm.playMenu.options(someOptions);

                    if (cb !== undefined) {
                        cb();
                    }
                });
            });
        });
    }

    /*Save status to database and push to client.

    If no status is given, load the last status from the database and push that
    to the client.

    Args:
        status: A string containing the current status message to be pushed to
            the client.
    */
    function updateStatus(statusText) {
        var oldStatus;

        oldStatus = g.statusText;
        if (statusText === undefined) {
            g.vm.playMenu.statusText(oldStatus);
        } else if (statusText !== oldStatus) {
            db.setGameAttributes({statusText: statusText}, function () {
                g.vm.playMenu.statusText(statusText);
//                console.log("Set status: " + statusText);
            });
        }
    }

    /*Save phase text to database and push to client.

    If no phase text is given, load the last phase text from the database and
    push that to the client.

    Args:
        phaseText: A string containing the current phase text to be pushed to
            the client.
    */
    function updatePhase(phaseText) {
        var oldPhaseText;

        oldPhaseText = g.phaseText;
        if (phaseText === undefined) {
            g.vm.playMenu.phaseText(oldPhaseText);
        } else if (phaseText !== oldPhaseText) {
            db.setGameAttributes({phaseText: phaseText}, function () {
                g.vm.playMenu.phaseText(phaseText);
//                console.log("Set phase: " + phaseText);
            });

            // Update phase in meta database. No need to have this block updating the UI or anything.
            g.dbm.transaction("leagues", "readwrite").objectStore("leagues").openCursor(g.lid).onsuccess = function (event) {
                var cursor, l;

                cursor = event.target.result;
                l = cursor.value;

                l.phaseText = phaseText;

                cursor.update(l);
            };
        }
    }

    return {
        init: init,
        datatable: datatable,
        datatableSinglePage: datatableSinglePage,
        dropdown: dropdown,
        realtimeUpdate: realtimeUpdate,
        title: title,
        update: update,
        updatePhase: updatePhase,
        updatePlayMenu: updatePlayMenu,
        updateStatus: updateStatus
    };
});