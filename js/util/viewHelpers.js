/**
 * @name util.viewHelpers
 * @namespace Helper functions called only by views.
 */
define(["db", "globals", "ui", "lib/jquery", "util/helpers"], function (db, g, ui, $, helpers) {
    "use strict";

    function beforeLeague(req, cb) {
        var reqCb, checkDbChange, leagueMenu, popup, updateEvents;

        g.lid = parseInt(req.params.lid, 10);
        g.realtimeUpdate = true;  // This is the default. It is set to false in views where appropriate

        popup = req.params.w === "popup";

        checkDbChange = function (lid) {
            var oldLastDbChange;

            // Stop if the league isn't viewed anymore
            if (lid !== g.lid) {
                return;
            }

            oldLastDbChange = g.lastDbChange;

            db.loadGameAttribute(null, "lastDbChange", function () {
                if (g.lastDbChange !== oldLastDbChange) {
                    db.loadGameAttributes(function () {
                        var leagueContentEl;

                        // This is a hack. Just delete everything and reload everything.
                        leagueContentEl = document.getElementById("league_content");
                        leagueContentEl.dataset.id = "";
                        //leagueContentEl.innerHTML = "&nbsp;";  // Blank doesn't work, for some reason
                        ui.realtimeUpdate(["dbChange"], function () {
                            ui.updatePlayMenu(null, function () {
                                ui.updatePhase();
                                ui.updateStatus();
                                setTimeout(checkDbChange, 3000, g.lid);
                            });
                        });
                    });
                } else {
                    setTimeout(checkDbChange, 3000, g.lid);
                }
            });
        };

        // Make sure league exists

        // Handle some common internal parameters
        updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];
        reqCb = req.raw.cb !== undefined ? cb : function () {};


        // Make sure league template FOR THE CURRENT LEAGUE is showing
        leagueMenu = document.getElementById("league_menu");
        if (leagueMenu === null || parseInt(leagueMenu.dataset.lid, 10) !== g.lid) {
            // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
            helpers.resetG();

            // Connect to league database
            db.connectLeague(g.lid, function () {
                db.loadGameAttributes(function () {
                    var css, data;

                    data = {
                        container: "content",
                        template: "leagueLayout",
                        vars: {}
                    };
                    ui.update(data);

                    // Set up the display for a popup: menus hidden, margins decreased, and new window links removed
                    if (popup) {
                        $("#top_menu").hide();
                        $("#league_menu").hide();
                        $("#league_content").css("margin-left", 0);
                        $("body").css("padding-top", "4px");

                        css = document.createElement("style");
                        css.type = "text/css";
                        css.innerHTML = ".new_window { display: none }";
                        document.body.appendChild(css);
                    }

                    // Update play menu
                    ui.updateStatus();
                    ui.updatePhase();
                    ui.updatePlayMenu(null, function () {
                        cb(updateEvents, reqCb);
                        checkDbChange(g.lid);
                    });
                });
            });
        } else {
            cb(updateEvents, reqCb);
        }
    }

    function beforeNonLeague() {
        var playButtonElement, playPhaseElement, playStatusElement;

        g.lid = null;

        playButtonElement = document.getElementById("playButton");
        if (playButtonElement) {
            playButtonElement.innerHTML = "";
        }
        playPhaseElement = document.getElementById("playPhase");
        if (playPhaseElement) {
            playPhaseElement.innerHTML = "";
        }
        playStatusElement = document.getElementById("playStatus");
        if (playStatusElement) {
            playStatusElement.innerHTML = "";
        }
    }

    return {
        beforeLeague: beforeLeague,
        beforeNonLeague: beforeNonLeague
    };
});