/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/account", "util/bbgmView", "util/helpers", "util/random", "util/viewHelpers"], function (g, ui, league, $, account, bbgmView, helpers, random, viewHelpers) {
    "use strict";

    var allAchievements;

    allAchievements = [{
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }, {
        aid: "participation2",
        name: "Participation2",
        desc: "You2 get an achievement just for signing up, you special snowflake!"
    }];

    function updateAccount(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();

            account.check(function () {
                if (g.vm.account.username() === null || g.vm.account.username() === "") {
                    deferred.resolve({
                        redirectUrl: "/login_or_register"
                    });
                } else {
                    deferred.resolve({
                        username: g.vm.account.username
                    });
                }
            });

            return deferred.promise();
        }
    }

    function updateAchievements(inputs, updateEvents, vm) {
        var deferred, tx;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();

            account.getAchievements(function (userAchievements) {
                var achievement, achievements, i;

                achievements = allAchievements.slice();
                for (i = 0; i < achievements.length; i++) {
                    achievements[i].count = userAchievements[achievements[i].aid] !== undefined ? userAchievements[achievements[i].aid] : 0;
                }

                deferred.resolve({
                    achievements: achievements
                });
            });

            return deferred.promise();
        }
    }

    function uiFirst() {
        var $login, $register;

        ui.title("Account");

        document.getElementById("logout").addEventListener("click", function (e) {
            e.preventDefault();
            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm.dev/logout.php",
                xhrFields: {
                    withCredentials: true
                },
                success: function () {
                    g.vm.account.username("");
                    ui.realtimeUpdate([], "/");
                }
            });
        });
    }

    return bbgmView.init({
        id: "account",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateAccount, updateAchievements],
        uiFirst: uiFirst
    });
});