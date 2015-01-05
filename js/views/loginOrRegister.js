/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "lib/jquery", "util/account", "util/bbgmView", "util/viewHelpers"], function (g, ui, $, account, bbgmView, viewHelpers) {
    "use strict";

    function uiFirst() {
        var $login, $register, ajaxErrorMsg;

        ui.title("Login or Register");

        ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

        $login = $("#login");
        $register = $("#register");

        $login.on("submit", function (event) {
            event.preventDefault();

            // Reset error display
            document.getElementById("login-error").innerHTML = "";

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm." + g.tld + "/login.php",
                data: $login.serialize() + "&sport=" + g.sport,
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    if (data.success) {
                        g.vm.topMenu.username(data.username);

                        // Check for participation achievement, if this is the first time logging in to this sport
                        account.getAchievements(function (achievements) {
                            if (achievements[0].count === 0) {
                                account.addAchievements(["participation"]).then(function () {
                                    ui.realtimeUpdate([], "/account");
                                });
                            } else {
                                ui.realtimeUpdate([], "/account");
                            }
                        });
                    } else {
                        document.getElementById("login-error").innerHTML = "Invalid username or password.";
                    }
                },
                error: function () {
                    document.getElementById("login-error").innerHTML = ajaxErrorMsg;
                }
            });
        });

        $register.on("submit", function (event) {
            event.preventDefault();

            // Reset error display
            document.getElementById("register-error").innerHTML = "";
            document.getElementById("register-username").parentNode.classList.remove("has-error");
            document.getElementById("register-email").parentNode.classList.remove("has-error");
            document.getElementById("register-password").parentNode.classList.remove("has-error");
            document.getElementById("register-password2").parentNode.classList.remove("has-error");
            document.getElementById("register-username-error").innerHTML = "";
            document.getElementById("register-email-error").innerHTML = "";
            document.getElementById("register-password-error").innerHTML = "";
            document.getElementById("register-password2-error").innerHTML = "";

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm." + g.tld + "/register.php",
                data: $register.serialize() + "&sport=" + g.sport,
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    var error;

                    if (data.success) {
                        g.vm.topMenu.username(data.username);

                        account.addAchievements(["participation"]).then(function () {
                            ui.realtimeUpdate([], "/account");
                        });
                    } else {
                        for (error in data.errors) {
                            if (data.errors.hasOwnProperty(error)) {
                                if (error === "username") {
                                    document.getElementById("register-username").parentNode.classList.add("has-error");
                                    document.getElementById("register-username-error").innerHTML = data.errors[error];
                                } else if (error === "email") {
                                    document.getElementById("register-email").parentNode.classList.add("has-error");
                                    document.getElementById("register-email-error").innerHTML = data.errors[error];
                                } else if (error === "password") {
                                    document.getElementById("register-password").parentNode.classList.add("has-error");
                                    document.getElementById("register-password-error").innerHTML = data.errors[error];
                                } else if (error === "password2") {
                                    document.getElementById("register-password2").parentNode.classList.add("has-error");
                                    document.getElementById("register-password2-error").innerHTML = data.errors[error];
                                } else if (error === "passwords") {
                                    document.getElementById("register-password").parentNode.classList.add("has-error");
                                    document.getElementById("register-password2").parentNode.classList.add("has-error");
                                    document.getElementById("register-password2-error").innerHTML = data.errors[error];
                                }
                            }
                        }
                    }
                },
                error: function () {
                    document.getElementById("register-error").innerHTML = ajaxErrorMsg;
                }
            });
        });
    }

    return bbgmView.init({
        id: "loginOrRegister",
        beforeReq: viewHelpers.beforeNonLeague,
        uiFirst: uiFirst
    });
});