/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/account", "util/bbgmView", "util/helpers", "util/random", "util/viewHelpers"], function (g, ui, league, $, account, bbgmView, helpers, random, viewHelpers) {
    "use strict";

    function updateAccount(inputs, updateEvents, vm) {
        var deferred, vars, tx;

        if (updateEvents.indexOf("firstRun") >= 0) {
            deferred = $.Deferred();
            vars = {};

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
        runBefore: [updateAccount],
        uiFirst: uiFirst
    });
});