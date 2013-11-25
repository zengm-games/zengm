/**
 * @name data.changes
 * @namespace Changes in gameplay to show the user.
 */
define(["lib/jquery", "util/eventLog"], function ($, eventLog) {
    "use strict";

    var all;

    all = [{
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
        msg: '<a href="https://twitter.com/basketball_gm">Follow Basketball GM on Twitter</a> to keep up with the latest news, updates, and discussion.'
    }, {
        date: "2013-10-16",
        msg: "Added fantasy draft feature - try it out by clicking Tools > Fantasy Draft!"
    }, {
        date: "2013-10-22",
        msg: "More realistic free agency. Free agency now lasts 30 days. The longer you wait to sign someone, the better deal you can get - but if you wait to long, he might sign with an other team. Also, you are now much less likely to get the first shot at signing every free agent."
    }, {
        date: "2013-11-03",
        msg: "Live play-by-play game simulation. Click \"Play > One day (live)\" to check it out."
    }, {
        date: "2013-11-10",
        msg: "Removed the roster size limit in trades. Now you (and AI teams) can go above and below the min and max roster sizes, as long as you get back within the limits before playing any more games."
    }];

    function check() {
        var i, linked, text, unread;

        // Don't show anything on first visit
        if (localStorage.changesRead === undefined) {
            localStorage.changesRead = all.length;
        }

        if (localStorage.changesRead < all.length) {
            unread = all.slice(localStorage.changesRead);

            text = "";
            linked = false;

            for (i = 0; i < unread.length; i++) {
                if (i > 0) {
                    text += "<br>";
                }
                text += "<strong>" + unread[i].date + "</strong>: " + unread[i].msg;
                if (i >= 2 && (unread.length - i - 1) > 0) {
                    linked = true;
                    text += '<br><a href="/changes">...and ' + (unread.length - i - 1) + ' more changes.</a>';
                    break;
                }
            }

            if (!linked) {
                text += '<br><a href="/changes">View All Changes</a>';
            }

            eventLog.add(null, {
                type: "changes",
                text: text,
                saveToDb: false
            });

            localStorage.changesRead = all.length;
        }
    }

    return {
        all: all,
        check: check
    };
});