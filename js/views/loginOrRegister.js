/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "core/league", "lib/jquery", "util/account", "util/bbgmView", "util/helpers", "util/viewHelpers"], function (g, ui, league, $, account, bbgmView, helpers, viewHelpers) {
    "use strict";

    function uiFirst() {
        var ajaxErrorMsg, $login, $register;

        ui.title("Login or Register");

        ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

        $login = $("#login");
        $register = $("#register");

        $login.on("submit", function (event) {
            event.preventDefault();

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm." + g.tld + "/login.php",
                data: $login.serialize(),
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    // Reset error display
                    document.getElementById("login-error").innerHTML = "";

                    if (data.success) {
                        g.vm.topMenu.username(data.username);
                        ui.realtimeUpdate([], "/account");
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
            var resetErrors;

            event.preventDefault();

            resetErrors = function () {
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
            };

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm." + g.tld + "/register.php",
                data: $register.serialize(),
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    var error;

                    resetErrors();

                    if (data.success) {
                        g.vm.topMenu.username(data.username);

                        account.addAchievements(["participation"], function () {
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
                    resetErrors();

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