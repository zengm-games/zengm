/**
 * @name data.changes
 * @namespace Changes in gameplay to show the user.
 */
define(["lib/jquery"], function ($) {
    "use strict";

    var c;

    c = [{
        date: "2013-09-21",
        msg: "The \"What would make this deal work?\" button can add assets from either team, either to make a trade good enough for the AI to accept or to have the AI offer up assets to entice the user. Previously, it would only add assets from the user's team to make the trade better for the AI."
    }, {
        date: "2013-09-21",
        msg: "Added a \"Trading Block\" page where you can ask all the AI teams to make offers for selected players or draft picks you control."
    }, {
        date: "2013-09-22",
        msg: "For any games simulated from now on, box scores will show quarter-by-quarter point totals."
    }];

    function check() {
        var date, i, text, unread;

        // Don't show anything on first visit
        if (localStorage.changesRead === undefined) {
            localStorage.changesRead = c.length;
        }

        if (localStorage.changesRead < c.length) {
            unread = c.slice(localStorage.changesRead);

            date = null;
            text = "";

            for (i = 0; i < unread.length; i++) {
                if (date !== unread[i].date) {
                    date = unread[i].date;
                    if (text.length > 0) {
                        text += "</ul>";
                    }
                    text += "<h4>" + date + "</h4><ul>";
                }

                text += "<li>" + unread[i].msg + "</li>";
            }

            $("#content").before('<div class="alert alert-info"><button type="button" class="close" data-dismiss="alert">&times;</button><h3>New since your last visit:</h3>' + text + '</div>');

            localStorage.changesRead = c.length;
        }
    }

    return {
        check: check
    };
});