/**
 * @name views.loginOrRegister
 * @namespace Login and register forms.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/viewHelpers"], function (g, ui, $, bbgmView, viewHelpers) {
    "use strict";

    function get(req) {
        return {
            token: req.params.token
        };
    }

    function updateToken(inputs) {
        return {
            token: inputs.token,
            showForm: null
        };
    }

    function uiFirst(vm) {
        var ajaxErrorMsg, token;

        token = vm.token();

        ui.title("Reset Password");

        ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

        // First, see if this is a valid token
        $.ajax({
            type: "POST",
            url: "//account.basketball-gm." + g.tld + "/reset_password.php",
            data: {action: "check_token", token: token, sport: g.sport},
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                var $resetpw;
                if (data.success) {
                    vm.showForm(true);

                    $resetpw = $("#resetpw");
                    $resetpw.on("submit", function (event) {
                        event.preventDefault();

                        // Reset error display
                        document.getElementById("resetpw-error").innerHTML = "";
                        document.getElementById("resetpw-password").parentNode.classList.remove("has-error");
                        document.getElementById("resetpw-password2").parentNode.classList.remove("has-error");
                        document.getElementById("resetpw-password-error").innerHTML = "";
                        document.getElementById("resetpw-password2-error").innerHTML = "";

                        $.ajax({
                            type: "POST",
                            url: "//account.basketball-gm." + g.tld + "/reset_password.php",
                            data: $resetpw.serialize() + "&sport=" + g.sport,
                            dataType: "json",
                            xhrFields: {
                                withCredentials: true
                            },
                            success: function (data) {
                                var error;

                                if (data.success) {
                                    g.vm.topMenu.username(data.username);

                                    ui.realtimeUpdate([], "/account");
                                } else {
                                    for (error in data.errors) {
                                        if (data.errors.hasOwnProperty(error)) {
                                            if (error === "password") {
                                                document.getElementById("resetpw-password").parentNode.classList.add("has-error");
                                                document.getElementById("resetpw-password-error").innerHTML = data.errors[error];
                                            } else if (error === "password2") {
                                                document.getElementById("resetpw-password2").parentNode.classList.add("has-error");
                                                document.getElementById("resetpw-password2-error").innerHTML = data.errors[error];
                                            } else if (error === "passwords") {
                                                document.getElementById("resetpw-password").parentNode.classList.add("has-error");
                                                document.getElementById("resetpw-password2").parentNode.classList.add("has-error");
                                                document.getElementById("resetpw-password2-error").innerHTML = data.errors[error];
                                            }
                                        }
                                    }
                                }
                            },
                            error: function () {
                                document.getElementById("resetpw-error").innerHTML = ajaxErrorMsg;
                            }
                        });
                    });
                } else {
                    vm.showForm(false);
                }
            },
            error: function () {
                document.getElementById("show-form-error").innerHTML = ajaxErrorMsg;
            }
        });
    }

    return bbgmView.init({
        id: "resetPassword",
        get: get,
        beforeReq: viewHelpers.beforeNonLeague,
        runBefore: [updateToken],
        uiFirst: uiFirst
    });
});