/**
 * @name views.lostPassword
 * @namespace Lost password handling.
 */
define(["globals", "ui", "lib/jquery", "util/bbgmView", "util/viewHelpers"], function (g, ui, $, bbgmView, viewHelpers) {
    "use strict";

    function uiFirst() {
        var $lostpw, ajaxErrorMsg;

        ui.title("Lost Password");

        ajaxErrorMsg = "Error connecting to server. Check your Internet connection or try again later.";

        $lostpw = $("#lostpw");

        $lostpw.on("submit", function (event) {
            event.preventDefault();

            // Reset error display
            document.getElementById("lostpw-error").innerHTML = "";
            document.getElementById("lostpw-success").innerHTML = "";

            $.ajax({
                type: "POST",
                url: "http://account.basketball-gm." + g.tld + "/lost_password.php",
                data: $lostpw.serialize() + "&sport=" + g.sport,
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (data) {
                    if (data.success) {
                        document.getElementById("lostpw-success").innerHTML = "Check your email for further instructions.";
                    } else {
                        document.getElementById("lostpw-error").innerHTML = "Account not found.";
                    }
                },
                error: function () {
                    document.getElementById("lostpw-error").innerHTML = ajaxErrorMsg;
                }
            });
        });
    }

    return bbgmView.init({
        id: "lostPassword",
        beforeReq: viewHelpers.beforeNonLeague,
        uiFirst: uiFirst
    });
});