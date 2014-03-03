/**
 * @name util.account
 * @namespace Functions for accessing account crap.
 */
define(["db", "globals", "core/team", "lib/jquery", "lib/underscore", "util/eventLog"], function (db, g, team, $, _, eventLog) {
    "use strict";

    var allAchievements, checkAchievement;

    // IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
    allAchievements = [{
        slug: "participation",
        name: "Participation",
        desc: "You get an achievement just for creating an account, you special snowflake!"
    }, {
        slug: "fo_fo_fo",
        name: "Fo Fo Fo",
        desc: "Go 16-0 in the playoffs."
    }, {
        slug: "septuawinarian",
        name: "Septuawinarian",
        desc: "Win 70+ games in the regular season."
    }, {
        slug: "98_degrees",
        name: "98 Degrees",
        desc: "Go 98-0 in the playoffs and regular season."
    }, {
        slug: "dynasty",
        name: "Dynasty",
        desc: "Win 6 championships in 8 years."
    }, {
        slug: "dynasty_2",
        name: "Dynasty 2",
        desc: "Win 8 championships in a row."
    }, {
        slug: "dynasty_3",
        name: "Dynasty 3",
        desc: "Win 11 championships in 13 years."
    }, {
        slug: "moneyball",
        name: "Moneyball",
        desc: "Win a title with a payroll under $40 million."
    }, {
        slug: "moneyball_2",
        name: "Moneyball 2",
        desc: "Win a title with a payroll under $30 million."
    }, {
        slug: "hardware_store",
        name: "Hardware Store",
        desc: "Sweep MVP, DPOY, ROY, and Finals MVP in the same season."
    }, {
        slug: "small_market",
        name: "Small Market",
        desc: "Win a title in a city with under 2 million people."
    }, {
        slug: "sleeper_pick",
        name: "Sleeper Pick",
        desc: "Use a non-lottery pick to draft the ROY."
    }, {
        slug: "sleeper_pick_2",
        name: "Sleeper Pick 2",
        desc: "One of your second round picks makes First Team All League on your team."
    }, {
        slug: "hacker",
        name: "Hacker",
        desc: 'Privately <a href="http://basketball-gm.com/contact/">report</a> a security issue in <a href="https://bitbucket.org/dumbmatter/bbgm-account">the account system</a> or some other part of the site.'
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
                var achievementStore, tx;

                // Save username for display
                g.vm.topMenu.username(data.username);

                // If user is logged in, upload any locally saved achievements
                if (data.username !== "") {
                    tx = g.dbm.transaction("achievements", "readwrite");
                    achievementStore = tx.objectStore("achievements");
                    achievementStore.getAll().onsuccess = function (event) {
                        var achievements;

                        achievements = _.pluck(event.target.result, "slug");

                        // If any exist, delete and upload
                        if (achievements.length > 0) {
                            achievementStore.clear();
                            // If this fails to save remotely, will be added to IDB again
                            addAchievements(achievements, true, function () {
                                if (cb !== undefined) {
                                    cb();
                                }
                            });
                        } else {
                            if (cb !== undefined) {
                                cb();
                            }
                        }
                    };
                } else {
                    if (cb !== undefined) {
                        cb();
                    }
                }
            }
        });
    }

    function getAchievements(cb) {
        var achievements;

        achievements = allAchievements.slice();

        g.dbm.transaction("achievements").objectStore("achievements").getAll().onsuccess = function (event) {
            var achievementsLocal, i, j;

            // Initialize counts
            for (i = 0; i < achievements.length; i++) {
                achievements[i].count = 0;
            }

            // Handle any achivements stored in IndexedDB
            achievementsLocal = event.target.result;
            for (j = 0; j < achievementsLocal.length; j++) {
                for (i = 0; i < achievements.length; i++) {
                    if (achievements[i].slug === achievementsLocal[j].slug) {
                        achievements[i].count += 1;
                    }
                }
            }

            // Handle any achievements stored in the cloud
            $.ajax({
                type: "GET",
                url: "http://account.basketball-gm." + g.tld + "/get_achievements.php",
                dataType: "json",
                xhrFields: {
                    withCredentials: true
                },
                success: function (achievementsRemote) {
                    var i;

                    for (i = 0; i < achievements.length; i++) {
                        achievements[i].count += achievementsRemote[achievements[i].slug] !== undefined ? achievementsRemote[achievements[i].slug] : 0;
                    }

                    cb(achievements);
                },
                error: function () {
                    cb(achievements);
                }
            });
        };
    }

    /**
     * Records one or more achievements.
     *
     * If logged in, try to record remotely and fall back to IndexedDB if necessary. If not logged in, just write to IndexedDB. Then, create a notification.
     * 
     * @memberOf util.helpers
     * @param {Array.<string>} achievements Array of achievement IDs (see allAchievements above).
     * @param {boolean=} silent If true, don't show any notifications (like if achievements are only being moved from IDB to remote). Default false.
     * @param {function()=} cb Optional callback.
     */
    function addAchievements(achievements, silent, cb) {
        var addToIndexedDB, notify;

        silent = silent !== undefined ? silent : false;

        notify = function (slug) {
            var i;

            if (silent) {
                return;
            }

            // Find name of achievement
            for (i = 0; i < allAchievements.length; i++) {
                if (allAchievements[i].slug === slug) {
                    eventLog.add(null, {
                        type: "achievement",
                        text: '"' + allAchievements[i].name + '" achievement awarded! <a href="/account">View all achievements.</a>'
                    });
                    break;
                }
            }
        };

        addToIndexedDB = function (achievements, cb) {
            var i, achievementStore, tx;

            tx = g.dbm.transaction("achievements", "readwrite");
            achievementStore = tx.objectStore("achievements");
            for (i = 0; i < achievements.length; i++) {
                achievementStore.add({
                    slug: achievements[i]
                });
                notify(achievements[i]);
            }

            tx.oncomplete = function () {
                if (cb !== undefined) {
                    cb();
                }
            };
        };

        $.ajax({
            type: "POST",
            url: "http://account.basketball-gm." + g.tld + "/add_achievements.php",
            data: {achievements: achievements},
            dataType: "json",
            xhrFields: {
                withCredentials: true
            },
            success: function (data) {
                var i;

                if (data.success) {
                    for (i = 0; i < achievements.length; i++) {
                        notify(achievements[i]);
                    }

                    if (cb !== undefined) {
                        cb();
                    }
                } else {
                    addToIndexedDB(achievements, cb);
                }
            },
            error: function () {
                addToIndexedDB(achievements, cb);
            }
        });
    }

    // FOR EACH checkAchievement FUNCTION:
    // If cb is passed, it gets true/false depending on if achievement should be awarded, but nothing is actually recorded. If cb is not, the achievement is directly added if it's awarded.
    checkAchievement = {};

    checkAchievement.fo_fo_fo = function (cb) {
        g.dbl.transaction("playoffSeries").objectStore("playoffSeries").get(g.season).onsuccess = function (event) {
            var found, i, playoffSeries, round, series;

            playoffSeries = event.target.result;
            series = playoffSeries.series;

            for (round = 0; round < series.length; round++) {
                found = false;
                for (i = 0; i < series[round].length; i++) {
                    if (series[round][i].away.won === 4 && series[round][i].home.won === 0 && series[round][i].away.tid === g.userTid) {
                        found = true;
                        break;
                    }
                    if (series[round][i].home.won === 4 && series[round][i].away.won === 0 && series[round][i].home.tid === g.userTid) {
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    if (cb !== undefined) {
                        cb(false);
                    }
                    return;
                }
            }

            if (cb !== undefined) {
                cb(true);
            } else {
                addAchievements(["fo_fo_fo"]);
            }
        };
    };

    checkAchievement.septuawinarian = function (cb) {
        team.filter({
            seasonAttrs: ["won"],
            season: g.season,
            tid: g.userTid
        }, function (t) {
            if (t.won >= 70) {
                if (cb !== undefined) {
                    cb(true);
                } else {
                    addAchievements(["septuawinarian"]);
                }
            } else {
                if (cb !== undefined) {
                    cb(false);
                }
            }
        });
    };

    checkAchievement["98_degrees"] = function (cb) {
        checkAchievement.fo_fo_fo(function (awarded) {
            if (awarded) {
                team.filter({
                    seasonAttrs: ["won", "lost"],
                    season: g.season,
                    tid: g.userTid
                }, function (t) {
                    if (t.won === 82 && t.lost === 0) {
                        if (cb !== undefined) {
                            cb(true);
                        } else {
                            addAchievements(["98_degrees"]);
                        }
                    } else {
                        if (cb !== undefined) {
                            cb(false);
                        }
                    }
                });
            } else {
                if (cb !== undefined) {
                    cb(false);
                }
            }
        });
    };

    function checkDynasty(titles, years, slug, cb) {
        g.dbl.transaction("teams").objectStore("teams").getAll().onsuccess = function (event) {
            var i, t, titlesFound;

            t = event.target.result[g.userTid];

            titlesFound = 0;
            // Look over past years
            for (i = 0; i < years; i++) {
                // Don't overshoot
                if (t.seasons.length - 1 - i < 0) {
                    break;
                }

                // Won title?
                if (t.seasons[t.seasons.length - 1 - i].playoffRoundsWon === 4) {
                    titlesFound += 1;
                }
            }

            if (titlesFound >= titles) {
                if (cb !== undefined) {
                    cb(true);
                } else {
                    addAchievements([slug]);
                }
            } else {
                if (cb !== undefined) {
                    cb(false);
                }
            }
        };
    }

    checkAchievement.dynasty = function (cb) {
        checkDynasty(6, 8, "dynasty", cb);
    };

    checkAchievement.dynasty_2 = function (cb) {
        checkDynasty(8, 8, "dynasty_2", cb);
    };

    checkAchievement.dynasty_3 = function (cb) {
        checkDynasty(11, 13, "dynasty_3", cb);
    };

    return {
        check: check,
        getAchievements: getAchievements,
        addAchievements: addAchievements,
        checkAchievement: checkAchievement
    };
});