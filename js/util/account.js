/**
 * @name util.account
 * @namespace Functions for accessing account crap.
 */
define(["db", "globals", "lib/jquery"], function (db, g, $) {
    "use strict";

    var allAchievements;

    allAchievements = [{
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for creating an account, you special snowflake!"
    }, {
        aid: "fo-fo-fo",
        name: "Fo Fo Fo",
        desc: "Go 16-0 in the playoffs."
    }, {
        aid: "septuawinarian",
        name: "Septuawinarian",
        desc: "Win 70+ games in the regular season."
    }, {
        aid: "98-degrees",
        name: "98 Degrees",
        desc: "Go 98-0 in the playoffs and regular season."
    }, {
        aid: "dynasty",
        name: "Dynasty",
        desc: "Win 6 championships in 8 years."
    }, {
        aid: "dynasty-2",
        name: "Dynasty 2",
        desc: "Win 8 championships in a row."
    }, {
        aid: "dynasty-3",
        name: "Dynasty 3",
        desc: "Win 11 championships in 13 years."
    }, {
        aid: "moneyball",
        name: "Moneyball",
        desc: "Win a title with a payroll under $40 million."
    }, {
        aid: "moneyball-2",
        name: "Moneyball 2",
        desc: "Win a title with a payroll under $30 million."
    }, {
        aid: "hardware-store",
        name: "Hardware Store",
        desc: "Sweep MVP, DPOY, ROY, and Finals MVP in the same season."
    }, {
        aid: "small-market",
        name: "Small Market",
        desc: "Win a title in a city with under 2 million people."
    }, {
        aid: "sleeper-pick",
        name: "Sleeper Pick",
        desc: "Use a non-lottery pick to draft the ROY."
    }, {
        aid: "sleeper-pick-2",
        name: "Sleeper Pick 2",
        desc: "One of your second round picks makes First Team All League on your team."
    }];

    function check(cb) {
        $.ajax({
            type: "GET",
            url: "http://account.basketball-gm." + g.tld + "/user_info.php",
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                g.vm.account.username(data.username);

                if (cb !== undefined) {
                    cb();
                }
            }
        });
    }

    function getAchievements(cb) {
        $.ajax({
            type: "GET",
            url: "http://account.basketball-gm." + g.tld + "/get_achievements.php",
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (userAchievements) {
                var achievements, i;

                achievements = allAchievements.slice();
                for (i = 0; i < achievements.length; i++) {
                    achievements[i].count = userAchievements[achievements[i].aid] !== undefined ? userAchievements[achievements[i].aid] : 0;
                }

                cb(achievements);
            }
        });
    }

    return {
        check: check,
        getAchievements: getAchievements
    };
});