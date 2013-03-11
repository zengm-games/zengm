/**
 * @name ui
 * @namespace Anything that directly updates the UI.
 */
define(["db", "globals", "lib/davis", "lib/handlebars.runtime", "lib/jquery", "util/lock"], function (db, g, Davis, Handlebars, $, lock) {
    "use strict";

    // Things to do on initial page load
    function init() {
        var slideOut;

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
    }

    function highlightNav(leaguePage) {
        if (leaguePage === "") {
            leaguePage = "league_dashboard";
        }
        $("#league_sidebar li").removeClass("active");
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
     * Replaces the displayed view.
     *
     * This updates the content of the page (either #content if data.inLeague is false or #league_content otherwise), sets the title (and appends the league number to it when appropriate), and injects g.lid as lid to the template.
     *
     * @memberOf ui
     * @param  {Object} data An object with several properties: "title" the title of the page; "vars" the variables to be passed to the handlebars template; "template" the name of the handlebars template; "isLeague" a boolean saying whether this is within a league or not.
     * @param {function()=} cb Optional callback
     */
    function update(data, cb) {
        var leaguePage, rendered, result;

        data.vars.lid = g.lid;
        rendered = Handlebars.templates[data.template](data.vars);
        $("#" + data.container).html(rendered);

        if (data.hasOwnProperty("title")) {
            if (data.container === "league_content") {
                data.title += " - " + g.leagueName;
            }
            $("title").text(data.title + " - Basketball GM");
        }

        result = parseLeagueUrl(document.URL);
        leaguePage = result[2];
        highlightNav(leaguePage);

        if (cb !== undefined) {
            cb();
        }
    }

    // Data tables
    // fnStateSave and fnStateLoad are based on http://www.datatables.net/blog/localStorage_for_state_saving except the id of the table is used in the key. This means that whatever you do to a table (sorting, viewing page, etc) will apply to every identical table in other leagues.
    function datatable(table, sort_col, data) {
        table.dataTable({
            aaData: data,
            aaSorting: [[sort_col, "desc"]],
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
        });
    }
    function datatableSinglePage(table, sort_col, data) {
        table.dataTable({
            aaData: data,
            aaSorting: [[sort_col, "desc"]],
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
        });
    }

    // For dropdown menus to change team/season/whatever
    // This should be cleaned up, but it works for now.
    function dropdown(select1, select2, extraParam) {
        if (arguments.length === 1) {
            select1.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = "/l/" + g.lid + "/" + league_page + "/" + select1.val();
                Davis.location.assign(new Davis.Request(url));
            });
        } else if (arguments.length >= 2) {
            select1.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = "/l/" + g.lid + "/" + league_page + "/" + select1.val() + "/" + select2.val();
                if (extraParam !== undefined && extraParam !== null) {
                    url += "/" + extraParam;
                }
                Davis.location.assign(new Davis.Request(url));
            });
            select2.change(function (event) {
                var league_page, league_root_url, result, url;

                result = parseLeagueUrl(document.URL);
                league_root_url = result[1];
                league_page = result[2];
                url = "/l/" + g.lid + "/" + league_page + "/" + select1.val() + "/" + select2.val();
                if (extraParam !== undefined && extraParam !== null) {
                    url += "/" + extraParam;
                }
                Davis.location.assign(new Davis.Request(url));
            });
        }
    }

    /**
     * Smartly update the currently loaded view, based on the current game state.
     *
     * @memberOf ui
     * @param {function()=} cb Optional callback that will run after the page updates.
     */
    function realtimeUpdate(cb) {
        if (g.realtimeUpdate) {
            // If tracking is enabled, don't track realtime updates
            if (Davis.Request.prototype.noTrack !== undefined) {
                Davis.Request.prototype.noTrack();
            }

            // Refresh standings if it's the current season standings and the phase is during the regular season
            Davis.location.replace(new Davis.Request(location.pathname, {cb: cb}));
        } else {
            if (cb !== undefined) {
                cb();
            }
        }
    }

    /*Get current options based on game state and push rendered play button
    to client. ot is passed on to the lock functions.
    */
    function updatePlayMenu(ot, cb) {
        var allOptions, keys;

        allOptions = [{id: "play-menu-stop", label: "Stop"},
                      {id: "play-menu-day", label: "One day"},
                      {id: "play-menu-week", label: "One week"},
                      {id: "play-menu-month", label: "One month"},
                      {id: "play-menu-until-playoffs", label: "Until playoffs"},
                      {id: "play-menu-through-playoffs", label: "Through playoffs"},
                      {id: "play-menu-until-draft", label: "Until draft"},
                      {id: "play-menu-view-draft", url: "/l/" + g.lid + "/draft", label: "View draft"},
                      {id: "play-menu-until-resign-players", label: "Resign players with expiring contracts"},
                      {id: "play-menu-until-free-agency", label: "Until free agency"},
                      {id: "play-menu-until-preseason", label: "Until preseason"},
                      {id: "play-menu-until-regular-season", label: "Until regular season"},
                      {id: "play-menu-contract-negotiation", url: "/l/" + g.lid + "/negotiation", label: "Continue contract negotiation"},
                      {id: "play-menu-contract-negotiation-list", url: "/l/" + g.lid + "/negotiation", label: "Continue resigning players"}];

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

        lock.gamesInProgress(ot, function (gamesInProgress) {
            if (gamesInProgress) {
                keys = ["play-menu-stop"];
            }

            lock.negotiationInProgress(ot, function (negotiationInProgress) {
                var i, ids, j, playButtonElement, someOptions;

                if (negotiationInProgress && g.phase !== g.PHASE.RESIGN_PLAYERS) {
                    keys = ["play-menu-contract-negotiation"];
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

                playButtonElement = document.getElementById("playButton");
                if (playButtonElement) {
                    playButtonElement.innerHTML = Handlebars.templates.playButton({options: someOptions});
                }

                require("api").playMenuHandlers();  // Because of circular dependency

                if (cb !== undefined) {
                    cb();
                }
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
        var oldStatus, playStatusElement;

        oldStatus = g.statusText;
        playStatusElement = document.getElementById("playStatus");
        if (statusText === undefined) {
            statusText = oldStatus;
            if (playStatusElement) {
                playStatusElement.innerHTML = statusText;
            }
        }
        if (statusText !== oldStatus) {
            db.setGameAttributes({statusText: statusText}, function () {
                if (playStatusElement) {
                    playStatusElement.innerHTML = statusText;
                }
                console.log("Set status: " + statusText);
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
        var oldPhaseText, playPhaseElement;

        oldPhaseText = g.phaseText;
        playPhaseElement = document.getElementById("playPhase");
        if (phaseText === undefined) {
            phaseText = oldPhaseText;
            if (playPhaseElement) {
                playPhaseElement.innerHTML = phaseText;
            }
        }
        if (phaseText !== oldPhaseText) {
            db.setGameAttributes({phaseText: phaseText}, function () {
                if (playPhaseElement) {
                    playPhaseElement.innerHTML = phaseText;
                }
                console.log("Set phase: " + phaseText);
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

    function moveToNewWindow() {
        // Window name is set to the current time, so each window has a unique name and thus a new window is always opened
        window.open(document.URL + "?w=popup", Date.now(), "height=600,width=800,scrollbars=yes");
        Davis.location.assign(new Davis.Request("/l/" + g.lid));
    }

    $(document).ready(function () {
        var league_id, league_page, league_root_url, result;

        result = parseLeagueUrl(document.URL);
        league_id = result[0];
        league_root_url = result[1];
        league_page = result[2];
        highlightNav(league_page);
    });

    return {
        init: init,
        datatable: datatable,
        datatableSinglePage: datatableSinglePage,
        dropdown: dropdown,
        realtimeUpdate: realtimeUpdate,
        update: update,
        updatePhase: updatePhase,
        updatePlayMenu: updatePlayMenu,
        updateStatus: updateStatus,
        moveToNewWindow: moveToNewWindow
    };
});