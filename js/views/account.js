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

        $login = $("#login");
        $register = $("#register");

        $login.on("submit", function (event) {
            event.preventDefault();

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm.dev/login.php",
                data: $login.serialize(),
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    // Reset error display
                    document.getElementById("login-error").innerHTML = "";

                    if (data.success) {
console.log("SUCCESS");
console.log(data);
                    } else {
                        document.getElementById("login-error").innerHTML = "Invalid username or password.";
                    }
                }
            });
        });

        $register.on("submit", function (event) {
            event.preventDefault();

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm.dev/register.php",
                data: $register.serialize(),
                dataType: "json",
                success: function (data) {
                    var error;

                    // Reset error display
                    document.getElementById("register-username").parentNode.classList.remove("has-error");
                    document.getElementById("register-email").parentNode.classList.remove("has-error");
                    document.getElementById("register-password").parentNode.classList.remove("has-error");
                    document.getElementById("register-password2").parentNode.classList.remove("has-error");
                    document.getElementById("register-username-error").innerHTML = "";
                    document.getElementById("register-email-error").innerHTML = "";
                    document.getElementById("register-password-error").innerHTML = "";
                    document.getElementById("register-password2-error").innerHTML = "";

                    if (data.success) {
console.log("SUCCESS");
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