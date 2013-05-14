/**
 * @name util.viewHelpers
 * @namespace Helper functions called only by views.
 */
define(["db", "globals", "ui", "lib/jquery", "lib/knockout", "util/helpers"], function (db, g, ui, $, ko, helpers) {
    "use strict";

    function beforeLeague(req, cb) {
        var reqCb, checkDbChange, leagueMenu, popup, updateEvents;

        g.lid = parseInt(req.params.lid, 10);

        popup = req.params.w === "popup";

        checkDbChange = function (lid) {
            var oldLastDbChange;

            // Stop if the league isn't viewed anymore
            if (lid !== g.lid) {
                return;
            }

            // db.loadGameAttribute cannot be used to check for a new lastDbChange because we need to have the old g.lastDbChange available right up to the last moment possible, for cases where db.loadGameAttribute might be blocked during a slow page refresh, as happens when viewing player rating and stat distributions. Otherwise, an extra refresh would occur with a stale lastDbChange.
            g.dbl.transaction("gameAttributes").objectStore("gameAttributes").get("lastDbChange").onsuccess = function (event) {
                if (g.lastDbChange !== event.target.result.value) {
console.log("HI " + g.lastDbChange + " " + event.target.result.value)
                    db.loadGameAttributes(function () {
                        document.getElementById("league_content").dataset.id = "";
                        //leagueContentEl.innerHTML = "&nbsp;";  // Blank doesn't work, for some reason
                        ui.realtimeUpdate(["dbChange"], undefined, function () {
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
            };
        };

        // Make sure league exists

        // Handle some common internal parameters
        updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];
        reqCb = req.raw.cb !== undefined ? req.raw.cb : function () {};

        // Make sure league template FOR THE CURRENT LEAGUE is showing
        leagueMenu = document.getElementById("league-menu");
        if (leagueMenu === null || g.vm.leagueMenu.lid() !== g.lid) {
            // Clear old game attributes from g, to make sure the new ones are saved to the db in db.setGameAttributes
            helpers.resetG();

            // Connect to league database
            db.connectLeague(g.lid, function () {
                db.loadGameAttributes(function () {
                    var css;

                    g.vm.leagueMenu.lid(g.lid);

                    ui.update({
                        container: "content",
                        template: "leagueLayout"
                    });

                    leagueMenu = document.getElementById("league-menu");
                    ko.applyBindings(g.vm.leagueMenu, leagueMenu);

                    // Set up the display for a popup: menus hidden, margins decreased, and new window links removed
                    if (popup) {
                        $("#top_menu").hide();
                        leagueMenu.style.display = "none";
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
                        document.getElementById("play-menu").style.visibility = "visible";
                        cb(updateEvents, reqCb);
                        checkDbChange(g.lid);
                    });
                });
            });
        } else {
            cb(updateEvents, reqCb);
        }
    }

    function beforeNonLeague(req, cb) {
        var playButtonElement, playPhaseElement, playStatusElement, reqCb, updateEvents;

        g.lid = null;

        document.getElementById("play-menu").style.visibility = "hidden";

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