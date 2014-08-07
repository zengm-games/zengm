/**
 * @name util.viewHelpers
 * @namespace Helper functions called only by views.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "lib/underscore", "util/helpers"], function (db, g, ui, $, ko, _, helpers) {
    "use strict";

    function beforeLeague(req, cb) {
        var reqCb, checkDbChange, popup, updateEvents;

        g.lid = parseInt(req.params.lid, 10);

        popup = req.params.w === "popup";

        // Check for some other window making changes to the database
        checkDbChange = function (lid) {
            // Stop if the league isn't viewed anymore
            if (lid !== g.lid) {
                return;
            }

            // db.loadGameAttribute cannot be used to check for a new lastDbChange because we need to have the old g.lastDbChange available right up to the last moment possible, for cases where db.loadGameAttribute might be blocked during a slow page refresh, as happens when viewing player rating and stat distributions. Otherwise, an extra refresh would occur with a stale lastDbChange.
            g.dbl.transaction("gameAttributes").objectStore("gameAttributes").get("lastDbChange").onsuccess = function (event) {
                if (g.lastDbChange !== event.target.result.value) {
                    db.loadGameAttributes(null, function () {
                        document.getElementById("league_content").dataset.id = "";
                        //leagueContentEl.innerHTML = "&nbsp;";  // Blank doesn't work, for some reason
                        ui.realtimeUpdate(["dbChange"], undefined, function () {
                            ui.updatePlayMenu(null, function () {
                                ui.updatePhase();
                                ui.updateStatus();
                                setTimeout(function () { checkDbChange(g.lid); }, 3000); // g.lid can't be passed as third argument when using Bugsnag
                            });
                        });
                    });
                } else {
                    setTimeout(function () { checkDbChange(g.lid); }, 3000); // g.lid can't be passed as third argument when using Bugsnag
                }
            };
        };

        // Make sure league exists

        // Handle some common internal parameters
        updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];
        reqCb = req.raw.cb !== undefined ? req.raw.cb : function () {};

        // Make sure league template FOR THE CURRENT LEAGUE is showing
        if (g.vm.topMenu.lid() !== g.lid) {
            // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
            helpers.resetG();

            // Make sure this league exists before proceeding
            g.dbm.transaction("leagues").objectStore("leagues").get(g.lid).onsuccess = function (event) {
                if (event.target.result === undefined) {
                    helpers.error('League not found. <a href="/new_league">Create a new league</a> or <a href="/">load an existing league</a> to play!', reqCb, true)
                } else {
                    // Connect to league database
                    db.connectLeague(g.lid, function () {
                        db.loadGameAttributes(null, function () {
                            var css;

                            ui.update({
                                container: "content",
                                template: "leagueLayout"
                            });
                            ko.applyBindings(g.vm.topMenu, document.getElementById("left-menu"));

                            // Set up the display for a popup: menus hidden, margins decreased, and new window links removed
                            if (popup) {
                                $("#top-menu").hide();
                                $("body").css("padding-top", "0");

                                css = document.createElement("style");
                                css.type = "text/css";
                                css.innerHTML = ".new_window { display: none }";
                                document.body.appendChild(css);
                            }

                            // Update play menu
                            ui.updateStatus();
                            ui.updatePhase();
                            ui.updatePlayMenu(null, function () {
                                g.vm.topMenu.lid(g.lid);
                                cb(updateEvents, reqCb);
                                checkDbChange(g.lid);
                            });
                        });
                    });
                }
            }
        } else {
            cb(updateEvents, reqCb);
        }
    }

    function beforeNonLeague(req, cb) {
        var playButtonElement, playPhaseElement, playStatusElement, reqCb, updateEvents;

        g.lid = null;
        g.vm.topMenu.lid(undefined);

        if (cb !== undefined) {
            updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];
            reqCb = req.raw.cb !== undefined ? req.raw.cb : function () {};
            cb(updateEvents, reqCb);
        }
    }

    return {
        beforeLeague: beforeLeague,
        beforeNonLeague: beforeNonLeague
    };
});