/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "lib/bluebird", "lib/jquery", "lib/knockout", "util/account", "util/bbgmView", "util/viewHelpers"], function (g, ui, Promise, $, ko, account, bbgmView, viewHelpers) {
    "use strict";

    var ajaxErrorMsg;
    ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

    function InitViewModel() {
        this.formError = ko.observable();
    }

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

                return Promise.resolve($.ajax({
                    type: "GET",
                    url: "//account.basketball-gm." + g.tld + "/gold_card_info.php",
                    data: {
                        sport: "basketball"
                    },
                    dataType: "json",
                    xhrFields: {
                        withCredentials: true
                    }
                })).then(function (data) {
                    return {
                        last4: data.last4,
                        expMonth: data.expMonth,
                        expYear: data.expYear
                    };
                }).catch(function () {
                    return {
                        last4: "????",
                        expMonth: "??",
                        expYear: "????"
                    };
                });
            });
        }
    }

    function stripeResponseHandler(vm, status, response) {
        var $form, token;

        $form = $('#payment-form');

        if (response.error) {
            vm.formError(response.error.message);
            $form.find('button').prop('disabled', false);
        } else {
            token = response.id;

            Promise.resolve($.ajax({
                type: "POST",
                url: "//account.basketball-gm." + g.tld + "/gold_card_update.php",
                data: {
                    sport: "basketball",
                    token: token
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                }
            })).then(function (data) {
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
            }).catch(function (err) {
console.log(err);
                vm.formError(ajaxErrorMsg);
                $form.find('button').prop('disabled', false);
            });
        }
    }

    function uiFirst(vm) {
        ui.title("Update Card");

        require(["stripe"], function (Stripe) {
            Stripe.setPublishableKey(g.stripePublishableKey);

            $('#payment-form').submit(function () {
                var $form = $(this);

                $form.find('button').prop('disabled', true);

                Stripe.card.createToken($form, stripeResponseHandler.bind(null, vm));

                return false;
            });
        });
    }

    return bbgmView.init({
        id: "accountUpdateCard",
        InitViewModel: InitViewModel,
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateAccountUpdateCard],
        uiFirst: uiFirst
    });
});