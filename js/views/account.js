/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/account", "util/bbgmView", "util/helpers", "util/random", "util/viewHelpers"], function (g, ui, league, $, account, bbgmView, helpers, random, viewHelpers) {
    "use strict";

    function updateAccount(inputs, updateEvents) {
        if (updateEvents.indexOf("firstRun") >= 0) {
            return account.check().then(function () {
                return {
                    username: g.vm.topMenu.username
                };
            });
        }
    }

    function updateAchievements(inputs, updateEvents) {
        if (updateEvents.indexOf("firstRun") >= 0) {
            return account.getAchievements().then(function (achievements) {
                return {
                    achievements: achievements
                };
            });
        }
    }

    function uiFirst() {
        ui.title("Account");

        document.getElementById("logout").addEventListener("click", function (e) {
            e.preventDefault();

            // Reset error display
            document.getElementById("logout-error").innerHTML = "";

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm." + g.tld + "/logout.php",
                data: "sport=" + g.sport,
                xhrFields: {
                    withCredentials: true
                },
                success: function () {
                    // Reset error display
                    document.getElementById("logout-error").innerHTML = "";

                    g.vm.topMenu.username("");
                    ui.realtimeUpdate([], "/");
                },
                error: function () {
                    document.getElementById("logout-error").innerHTML = "Error connecting to server. Check your Internet connection or try again later.";
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