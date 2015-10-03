/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
'use strict';

var g = require('../globals');
var ui = require('../ui');
var Promise = require('bluebird');
var $ = require('jquery');
var account = require('../util/account');
var bbgmView = require('../util/bbgmView');
var viewHelpers = require('../util/viewHelpers');

var ajaxErrorMsg;
ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

function get(req) {
    return {
        goldSuccess: req.raw.goldResult !== undefined && req.raw.goldResult.success !== undefined ? req.raw.goldResult.success : null,
        goldMessage: req.raw.goldResult !== undefined && req.raw.goldResult.message !== undefined ? req.raw.goldResult.message : null
    };
}

function updateAccount(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
        return account.check().then(function () {
            var currentTimestamp, goldUntilDate, goldUntilDateString, showGoldActive, showGoldCancelled, showGoldPitch;

            goldUntilDate = new Date(g.vm.topMenu.goldUntil() * 1000);
            goldUntilDateString = goldUntilDate.toDateString();

            currentTimestamp = Math.floor(Date.now() / 1000);
            showGoldActive = !g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil();
            showGoldCancelled = g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil();
            showGoldPitch = !showGoldActive;

            return {
                username: g.vm.topMenu.username,
                goldUntilDateString: goldUntilDateString,
                showGoldActive: showGoldActive,
                showGoldCancelled: showGoldCancelled,
                showGoldPitch: showGoldPitch,
                goldSuccess: inputs.goldSuccess,
                goldMessage: inputs.goldMessage
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


function handleStripeButton() {
    var buttonEl;

    buttonEl = document.getElementById("stripe-button");

    if (!buttonEl) { return; }

    require(["stripe-checkout"], function (StripeCheckout) {
        var email, handler;

        email = g.vm.topMenu.email();

        handler = StripeCheckout.configure({
            key: g.stripePublishableKey,
            image: '/ico/icon128.png',
            token: function (token) {
                Promise.resolve($.ajax({
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
                })).then(function (data) {
                    ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
                }).catch(function (err) {
                    console.log(err);
                    ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: {
                        success: false,
                        message: ajaxErrorMsg
                    }});
                });
            }
        });

        buttonEl.addEventListener("click", function (e) {
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
    document.getElementById("gold-cancel").addEventListener("click", function (e) {
        var result;

        e.preventDefault();

        result = window.confirm("Are you sure you want to cancel your Basketball GM Gold subscription?");

        if (result) {
            Promise.resolve($.ajax({
                type: "POST",
                url: "//account.basketball-gm." + g.tld + "/gold_cancel.php",
                data: {
                    sport: "basketball"
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                }
            })).then(function (data) {
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: data});
            }).catch(function (err) {
                console.log(err);
                ui.realtimeUpdate(["account"], "/account", undefined, {goldResult: {
                    success: false,
                    message: ajaxErrorMsg
                }});
            });
        }
    });
}

function uiFirst() {
    ui.title("Account");

    document.getElementById("logout").addEventListener("click", function (e) {
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
            success: function () {
                // Reset error display
                document.getElementById("logout-error").innerHTML = "";

                g.vm.topMenu.username("");
                ui.realtimeUpdate(["account"], "/");
            },
            error: function () {
                document.getElementById("logout-error").innerHTML = "Error connecting to server. Check your Internet connection or try again later.";
            }
        });
    });

    handleStripeButton();
    handleCancelLink();
}

module.exports = bbgmView.init({
    id: "account",
    get: get,
    beforeReq: viewHelpers.beforeNonLeague,
    runBefore: [updateAccount, updateAchievements],
    uiFirst: uiFirst
});
