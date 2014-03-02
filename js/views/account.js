/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/account", "util/bbgmView", "util/helpers", "util/random", "util/viewHelpers"], function (g, ui, league, $, account, bbgmView, helpers, random, viewHelpers) {
    "use strict";

    function updateAccount(inputs, updateEvents, vm) {
        var deferred;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();

            account.check(function () {
                deferred.resolve({
                    username: g.vm.account.username
                });
            });

            return deferred.promise();
        }
    }

    function updateAchievements(inputs, updateEvents, vm) {
        var deferred, tx;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();

            account.getAchievements(function (achievements) {
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
                url: "http://account.basketball-gm." + g.tld + "/logout.php",
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