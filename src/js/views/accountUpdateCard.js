const g = require('../globals');
const ui = require('../ui');
const Promise = require('bluebird');
const $ = require('jquery');
const ko = require('knockout');
const account = require('../util/account');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

function InitViewModel() {
    this.formError = ko.observable();
}

async function updateAccountUpdateCard(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
        await account.check();
        const username = g.vm.topMenu.username();

        if (username === null || username === "") {
            return {
                errorMessage: "Log in to view this page.",
            };
        }

        if (g.vm.topMenu.goldCancelled()) {
            return {
                errorMessage: "Cannot update card because your Basketball GM Gold account is cancelled.",
            };
        }

        try {
            const data = await Promise.resolve($.ajax({
                type: "GET",
                url: `//account.basketball-gm.${g.tld}/gold_card_info.php`,
                data: {
                    sport: "basketball",
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
            }));
            return {
                last4: data.last4,
                expMonth: data.expMonth,
                expYear: data.expYear,
            };
        } catch (err) {
            return {
                last4: "????",
                expMonth: "??",
                expYear: "????",
            };
        }
    }
}

async function stripeResponseHandler(vm, status, response) {
    const $form = $('#payment-form');

    if (response.error) {
        vm.formError(response.error.message);
        $form.find('button').prop('disabled', false);
    } else {
        const token = response.id;

        try {
            const data = await Promise.resolve($.ajax({
                type: "POST",
                url: `//account.basketball-gm.${g.tld}/gold_card_update.php`,
                data: {
                    sport: "basketball",
                    token,
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
            }));
            ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
        } catch (err) {
            console.log(err);
            vm.formError(ajaxErrorMsg);
            $form.find('button').prop('disabled', false);
        }
    }
}

function uiFirst(vm) {
    ui.title("Update Card");

    $.getScript('https://js.stripe.com/v2/', () => {
        window.Stripe.setPublishableKey(g.stripePublishableKey);

        $('#payment-form').submit(function () {
            const $form = $(this);
            $form.find('button').prop('disabled', true);

            window.Stripe.card.createToken($form, stripeResponseHandler.bind(null, vm));

            return false;
        });
    });
}

module.exports = bbgmView.init({
    id: "accountUpdateCard",
    InitViewModel,
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateAccountUpdateCard],
    uiFirst,
});
