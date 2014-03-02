/**
 * @name util.account
 * @namespace Functions for accessing account crap.
 */
define(["db", "globals", "lib/jquery"], function (db, g, $) {
    "use strict";

    var allAchievements;

    // IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
    allAchievements = [{
        aid: "participation",
        name: "Participation",
        desc: "You get an achievement just for creating an account, you special snowflake!"
    }, {
        aid: "fo_fo_fo",
        name: "Fo Fo Fo",
        desc: "Go 16-0 in the playoffs."
    }, {
        aid: "septuawinarian",
        name: "Septuawinarian",
        desc: "Win 70+ games in the regular season."
    }, {
        aid: "98_degrees",
        name: "98 Degrees",
        desc: "Go 98-0 in the playoffs and regular season."
    }, {
        aid: "dynasty",
        name: "Dynasty",
        desc: "Win 6 championships in 8 years."
    }, {
        aid: "dynasty_2",
        name: "Dynasty 2",
        desc: "Win 8 championships in a row."
    }, {
        aid: "dynasty_3",
        name: "Dynasty 3",
        desc: "Win 11 championships in 13 years."
    }, {
        aid: "moneyball",
        name: "Moneyball",
        desc: "Win a title with a payroll under $40 million."
    }, {
        aid: "moneyball_2",
        name: "Moneyball 2",
        desc: "Win a title with a payroll under $30 million."
    }, {
        aid: "hardware_store",
        name: "Hardware Store",
        desc: "Sweep MVP, DPOY, ROY, and Finals MVP in the same season."
    }, {
        aid: "small_market",
        name: "Small Market",
        desc: "Win a title in a city with under 2 million people."
    }, {
        aid: "sleeper_pick",
        name: "Sleeper Pick",
        desc: "Use a non-lottery pick to draft the ROY."
    }, {
        aid: "sleeper_pick_2",
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

    /**
     * Records one or more achievements.
     *
     * If logged in, try to record remotely and fall back to IndexedDB if necessary. If not logged in, just write to IndexedDB. Then, create a notification.
     * 
     * @memberOf util.helpers
     * @param {Array.<string>} achievements Array of achievement IDs (see allAchievements above).
     * @param {function} cb Callback function.
     */
    function addAchievements(achievements, cb) {
        $.ajax({
            type: "POST",
            url: "http://account.basketaaball-gm." + g.tld + "/add_achievements.php",
            data: {achievements: achievements},
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                if (data.success) {
console.log("SUCCESS");
                } else {
console.log("FAILURE, ADD to indexeddb");
                }
            },
            error: function () {
console.log("ERROR, ADD to indexeddb");
            }
        });
    }

    return {
        check: check,
        getAchievements: getAchievements,
        addAchievements: addAchievements
    };
});