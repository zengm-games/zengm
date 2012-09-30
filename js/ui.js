/**
 * @name ui
 * @namespace Anything that directly updates the UI.
 */
define(["db", "util/lock"], function (db, lock) {
    "use strict";

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
            // Get rid of any trailing #
            league_page = split_url[5].split("#")[0];
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
        var league_page, rendered, result;

        data.vars.lid = g.lid;
        rendered = Handlebars.templates[data.template](data.vars);
        $("#" + data.container).html(rendered);

        if (data.hasOwnProperty("title")) {
            if (data.container === "league_content") {
                data.title += " - League " + g.lid;
            }
            $("title").text(data.title + " - Basketball GM");
        }

        result = parseLeagueUrl(document.URL);
        league_page = result[2];
        highlightNav(league_page);

        if (typeof cb !== "undefined") {
            cb();
        }
    }

    // Data tables
    function datatable(table, sort_col, data) {
        table.dataTable({
            aaData: data,
            aaSorting: [[ sort_col, "desc" ]],
            bDeferRender: true,
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
            aaSorting: [[ sort_col, "desc" ]],
            bFilter: false,
            bInfo: false,
            bPaginate: false
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
                if (typeof extraParam !== "undefined" && extraParam.length > 0) {
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
                if (typeof extraParam !== "undefined" && extraParam.length > 0) {
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
        // Refresh standings if it's the current season standings and the phase is during the regular season
        Davis.location.replace(new Davis.Request(location.pathname, {cb: cb}));
    }

    /*Get current options based on game state and push rendered play button
    to client.
    */
    function updatePlayMenu() {
        var allOptions, button, i, ids, j, keys, playButtonElement, someOptions;

        allOptions = [{id: "stop", url: 'javascript:api.play("stop");', label: "Stop", normal_link: false},
                      {id: "day", url: 'javascript:api.play("day");', label: "One day", normal_link: false},
                      {id: "week", url: 'javascript:api.play("week");', label: "One week", normal_link: false},
                      {id: "month", url: 'javascript:api.play("month");', label: "One month", normal_link: false},
                      {id: "until_playoffs", url: 'javascript:api.play("until_playoffs");', label: "Until playoffs", normal_link: false},
                      {id: "through_playoffs", url: 'javascript:api.play("through_playoffs");', label: "Through playoffs", normal_link: false},
                      {id: "until_draft", url: 'javascript:api.play("until_draft");', label: "Until draft", normal_link: false},
                      {id: "view_draft", url: "/l/" + g.lid + "/draft", label: "View draft", normal_link: true},
                      {id: "until_resign_players", url: 'javascript:api.play("until_resign_players");', label: "Resign players with expiring contracts", normal_link: false},
                      {id: "until_free_agency", url: 'javascript:api.play("until_free_agency");', label: "Until free agency", normal_link: false},
                      {id: "until_preseason", url: 'javascript:api.play("until_preseason");', label: "Until preseason", normal_link: false},
                      {id: "until_regular_season", url: 'javascript:api.play("until_regular_season");', label: "Until regular season", normal_link: false},
                      {id: "contract_negotiation", url: "/l/" + g.lid + "/negotiation", label: "Continue contract negotiation", normal_link: true},
                      {id: "contract_negotiation_list", url: "/l/" + g.lid + "/negotiation", label: "Continue resigning players", normal_link: true}];

        if (g.phase === c.PHASE_PRESEASON) {
            // Preseason
            keys = ["until_regular_season"];
        } else if (g.phase === c.PHASE_REGULAR_SEASON) {
            // Regular season - pre trading deadline
            keys = ["day", "week", "month", "until_playoffs"];
        } else if (g.phase === c.PHASE_AFTER_TRADE_DEADLINE) {
            // Regular season - post trading deadline
            keys = ["day", "week", "month", "until_playoffs"];
        } else if (g.phase === c.PHASE_PLAYOFFS) {
            // Playoffs
            keys = ["day", "week", "month", "through_playoffs"];
        } else if (g.phase === c.PHASE_BEFORE_DRAFT) {
            // Offseason - pre draft
            keys = ["until_draft"];
        } else if (g.phase === c.PHASE_DRAFT) {
            // Draft
            keys = ["view_draft"];
        } else if (g.phase === c.PHASE_AFTER_DRAFT) {
            // Offseason - post draft
            keys = ["until_resign_players"];
        } else if (g.phase === c.PHASE_RESIGN_PLAYERS) {
            // Offseason - resign players
            keys = ["contract_negotiation_list", "until_free_agency"];
        } else if (g.phase === c.PHASE_FREE_AGENCY) {
            // Offseason - free agency
            keys = ["until_preseason"];
        }

        if (lock.games_in_progress()) {
            keys = ["stop"];
        }
        lock.negotiationInProgress(function (negotiationInProgress) {
            if (negotiationInProgress && g.phase !== c.PHASE_RESIGN_PLAYERS) {
                keys = ["contract_negotiation"];
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

            button = Handlebars.templates.playButton({options: someOptions});
            playButtonElement = document.getElementById("playButton");
            if (playButtonElement) {
                playButtonElement.innerHTML = button;
            }
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
        console.log('hi');
        window.open(document.URL, "name", "height=600,width=800,scrollbars=yes");
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