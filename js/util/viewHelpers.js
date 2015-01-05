/**
 * @name util.viewHelpers
 * @namespace Helper functions called only by views which pull important info (updateEvents and cb) from Davis request objects.
 */
define(["dao", "db", "globals", "ui", "core/league", "lib/bluebird", "lib/jquery", "lib/knockout", "util/helpers"], function (dao, db, g, ui, league, Promise, $, ko, helpers) {
    "use strict";

    function beforeLeague(req) {
        var checkDbChange, popup, reqCb, updateEvents;

        g.lid = parseInt(req.params.lid, 10);

        popup = req.params.w === "popup";

        // Check for some other window making changes to the database
        checkDbChange = function (lid) {
            // Stop if the league isn't viewed anymore
            if (lid !== g.lid) {
                return;
            }

            // league.loadGameAttribute cannot be used to check for a new lastDbChange because we need to have the old g.lastDbChange available right up to the last moment possible, for cases where league.loadGameAttribute might be blocked during a slow page refresh, as happens when viewing player rating and stat distributions. Otherwise, an extra refresh would occur with a stale lastDbChange.
            dao.gameAttributes.get({key: "lastDbChange"}).then(function (lastDbChange) {
                if (g.lastDbChange !== lastDbChange.value) {
                    league.loadGameAttributes(null).then(function () {
                        //leagueContentEl.innerHTML = "&nbsp;";  // Blank doesn't work, for some reason
                        ui.realtimeUpdate(["dbChange"], undefined, function () {
                            ui.updatePlayMenu(null).then(function () {
                                ui.updatePhase();
                                ui.updateStatus();
                                setTimeout(function () { checkDbChange(lid); }, 3000); // g.lid can't be passed as third argument when using Bugsnag
                            });
                        });
                    });
                } else {
                    setTimeout(function () { checkDbChange(lid); }, 3000); // g.lid can't be passed as third argument when using Bugsnag
                }
            });
        };

        // Make sure league exists

        // Handle some common internal parameters
        updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];
        reqCb = req.raw.cb !== undefined ? req.raw.cb : function () {};

        // Make sure league template FOR THE CURRENT LEAGUE is showing
        if (g.vm.topMenu.lid() !== g.lid) {
            // Clear old game attributes from g, to make sure the new ones are saved to the db in league.setGameAttributes
            helpers.resetG();

            // Make sure this league exists before proceeding
            return dao.leagues.get({key: g.lid}).then(function (l) {
                if (l === undefined) {
                    helpers.error('League not found. <a href="/new_league">Create a new league</a> or <a href="/">load an existing league</a> to play!', reqCb, true);
                } else {
                    // Connect to league database
                    return db.connectLeague(g.lid).then(function () {
                        return league.loadGameAttributes(null);
                    }).then(function () {
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
                        return ui.updatePlayMenu(null).then(function () {
                            g.vm.topMenu.lid(g.lid);
                            checkDbChange(g.lid);
                            return [updateEvents, reqCb];
                        });
                    });
                }
            });
        }

        return Promise.resolve([updateEvents, reqCb]);
    }

    function beforeNonLeague(req) {
        var reqCb, updateEvents;

        g.lid = null;
        g.vm.topMenu.lid(undefined);

        updateEvents = req.raw.updateEvents !== undefined ? req.raw.updateEvents : [];
        reqCb = req.raw.cb !== undefined ? req.raw.cb : function () {};
        return Promise.resolve([updateEvents, reqCb]);
    }

    return {
        beforeLeague: beforeLeague,
        beforeNonLeague: beforeNonLeague
    };
});