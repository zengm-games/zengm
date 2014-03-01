/**
 * @name util.account
 * @namespace Functions for accessing account crap.
 */
define(["db", "globals", "lib/jquery"], function (db, g, $) {
    "use strict";

    function check() {
        $.ajax({
            type: "GET",
            url: "http://account.basketball-gm.dev/user_info.php",
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                g.vm.account.username(data.username);
            }
        });
    }

    return {
        check: check
    };
});