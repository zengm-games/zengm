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
    }, {
        date: "2013-10-01",
        msg: "New mobile-friendly UI - try playing in Chrome or Firefox on your Android device!"
    }, {
        date: "2013-10-02",
        msg: '<a href="https://twitter.com/basketball_gm">Follow Basketball GM on Twitter</a> to keep up with the latest news, updates, and discussion:<br><a href="https://twitter.com/basketball_gm" class="twitter-follow-button" data-show-count="false" data-lang="en">Follow @basketball_GM</a><script>!function(d,s,id){var js,fjs=d.getElementsByTagName(s)[0];if(!d.getElementById(id)){js=d.createElement(s);js.id=id;js.src="//platform.twitter.com/widgets.js";fjs.parentNode.insertBefore(js,fjs);}}(document,"script","twitter-wjs");</script>'
    }, {
        date: "2013-10-16",
        msg: "Added fantasy draft feature - try it out by clicking Tools > Fantasy Draft!"
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
                    text += "<h5>" + date + "</h5><ul>";
                }

                text += "<li>" + unread[i].msg + "</li>";
            }

            $("#content").before('<div class="alert alert-info alert-top alert-changes"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>New since your last visit:</h4>' + text + '</div>');

            localStorage.changesRead = c.length;
        }
    }

    return {
        check: check
    };
});