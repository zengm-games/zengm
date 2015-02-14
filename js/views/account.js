/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/account", "util/bbgmView", "util/helpers", "util/random", "util/viewHelpers"], function (g, ui, league, $, account, bbgmView, helpers, random, viewHelpers) {
    "use strict";

    function updateAccount(inputs, updateEvents) {
        if (updateEvents.indexOf("firstRun") >= 0) {
            return account.check().then(function () {
                var currentTimestamp, showGoldPitch;

                currentTimestamp = Math.floor(Date.now() / 1000);

                showGoldPitch = true || g.vm.topMenu.goldUntil < currentTimestamp || g.vm.topMenu.goldCancelled;

                return {
                    username: g.vm.topMenu.username,
                    showGoldPitch: showGoldPitch
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
        var customButtonEl, s, sc;

        customButtonEl = document.getElementById("customButton");

        if (!customButtonEl) { return; }


        sc = document.createElement("script");
        sc.type = "text/javascript";
        sc.async = true;
        sc.src = "https://checkout.stripe.com/checkout.js";
        s = document.getElementsByTagName('script')[0];
        s.parentNode.insertBefore(sc, s);

        sc.onload = function () {
            var email, handler;

            email = g.vm.topMenu.email();
console.log(email);

            handler = window.StripeCheckout.configure({
                key: 'pk_test_gFqvUZCI8RgSl5KMIYTmZ5yI',
                image: '/ico/icon128.png',
                token: function (token) {
                    Promise.resolve($.ajax({
                        type: "POST",
                        url: "http://account.basketball-gm." + g.tld + "/gold_start.php",
                        data: {
                            sport: "basketball",
                            token: token.id,
                            email: email
                        },
                        dataType: "json",
                        xhrFields: {
                            withCredentials: true
                        }
                    })).then(function (data) {
console.log(data);
                    }).catch(function (err) {
console.log(err);
                        throw err;
                    });
                }
            });

            customButtonEl.addEventListener("click", function (e) {
                // Open Checkout with further options
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

            // Close Checkout on page navigation
            window.addEventListener("popstate", function () {
                handler.close();
            });
        };
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

        handleStripeButton();
    }

    return bbgmView.init({
        id: "account",
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateAccount, updateAchievements],
        uiFirst: uiFirst
    });
});