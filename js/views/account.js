const g = require('../globals');
const ui = require('../ui');
const Promise = require('bluebird');
const $ = require('jquery');
const account = require('../util/account');
const bbgmView = require('../util/bbgmView');
const viewHelpers = require('../util/viewHelpers');

const ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

function get(req) {
    return {
        goldSuccess: req.raw.goldResult !== undefined && req.raw.goldResult.success !== undefined ? req.raw.goldResult.success : null,
        goldMessage: req.raw.goldResult !== undefined && req.raw.goldResult.message !== undefined ? req.raw.goldResult.message : null
    };
}

async function updateAccount(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
        await account.check();

        const goldUntilDate = new Date(g.vm.topMenu.goldUntil() * 1000);
        const goldUntilDateString = goldUntilDate.toDateString();

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const showGoldActive = !g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil();
        const showGoldCancelled = g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil();
        const showGoldPitch = !showGoldActive;

        return {
            username: g.vm.topMenu.username,
            goldUntilDateString,
            showGoldActive,
            showGoldCancelled,
            showGoldPitch,
            goldSuccess: inputs.goldSuccess,
            goldMessage: inputs.goldMessage
        };
    }
}

async function updateAchievements(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        const achievements = await account.getAchievements();

        return {
            achievements: achievements
        };
    }
}


function handleStripeButton() {
    const buttonEl = document.getElementById("stripe-button");

    if (!buttonEl) { return; }

    $.getScript('https://checkout.stripe.com/checkout.js', () => {
        const email = g.vm.topMenu.email();

        const handler = window.StripeCheckout.configure({
            key: g.stripePublishableKey,
            image: '/ico/icon128.png',
            token: async token => {
                try {
                    const data = await Promise.resolve($.ajax({
                        type: "POST",
                        url: "//account.basketball-gm." + g.tld + "/gold_start.php",
                        data: {
                            sport: "basketball",
                            token: token.id
                        },
                        dataType: "json",
                        xhrFields: {
                            withCredentials: true
                        }
                    }));
                    ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
                } catch (err) {
                    console.log(err);
                    ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: {
                        success: false,
                        message: ajaxErrorMsg
                    }});
                }
            }
        });

        buttonEl.addEventListener("click", e => {
            handler.open({
                name: 'Basketball GM Gold',
                description: '',
                amount: 500,
                email: email,
                allowRememberMe: false,
                panelLabel: "Subscribe for $5/month"
            });
            e.preventDefault();
        });
    });
}

function handleCancelLink() {
    document.getElementById("gold-cancel").addEventListener("click", async e => {
        e.preventDefault();

        const result = window.confirm("Are you sure you want to cancel your Basketball GM Gold subscription?");

        if (result) {
            try {
                const data = await Promise.resolve($.ajax({
                    type: "POST",
                    url: "//account.basketball-gm." + g.tld + "/gold_cancel.php",
                    data: {
                        sport: "basketball"
                    },
                    dataType: "json",
                    xhrFields: {
                        withCredentials: true
                    }
                }));
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
            } catch (err) {
                console.log(err);
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: {
                    success: false,
                    message: ajaxErrorMsg
                }});
            }
        }
    });
}

function uiFirst() {
    ui.title("Account");

    document.getElementById("logout").addEventListener("click", e => {
        e.preventDefault();

        // Reset error display
        document.getElementById("logout-error").innerHTML = "";

        $.ajax({
            type: "POST",
            url: "//account.basketball-gm." + g.tld + "/logout.php",
            data: "sport=" + g.sport,
            xhrFields: {
                withCredentials: true
            },
            success: () => {
                // Reset error display
                document.getElementById("logout-error").innerHTML = "";

                g.vm.topMenu.username("");
                ui.realtimeUpdate(["account"], "/");
            },
            error: () => {
                document.getElementById("logout-error").innerHTML = "Error connecting to server. Check your Internet connection or try again later.";
            }
        });
    });

    handleStripeButton();
    handleCancelLink();
}

module.exports = bbgmView.init({
    id: "account",
    get,
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateAccount, updateAchievements],
    uiFirst
});
