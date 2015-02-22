/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "lib/bluebird", "lib/jquery", "util/account", "util/bbgmView", "util/viewHelpers"], function (g, ui, Promise, $, account, bbgmView, viewHelpers) {
    "use strict";

    var ajaxErrorMsg;
    ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

    function updateAccountUpdateCard(inputs, updateEvents) {
        if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
            return account.check().then(function () {
                var username;

                username = g.vm.topMenu.username();

                if (username === null || username === "") {
                    return {
                        errorMessage: "Log in to view this page."
                    };
                }

                if (g.vm.topMenu.goldCancelled()) {
                    return {
                        errorMessage: "Cannot update card because your Basketball GM Gold account is cancelled."
                    };
                }
            });
        }
    }

    function uiFirst() {
        ui.title("Update Card");

        require(["stripe"], function (Stripe) {
console.log("HI");
        });
    }

    return bbgmView.init({
        id: "accountUpdateCard",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateAccountUpdateCard],
        uiFirst: uiFirst
    });
});