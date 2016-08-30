/*eslint camelcase: 0*/
const g = require('../globals');
const team = require('../core/team');
const backboard = require('backboard');
const Promise = require('bluebird');
const $ = require('jquery');
const eventLog = require('./eventLog');
const ads = require('../util/ads');

// IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
const allAchievements = [{
    slug: "participation",
    name: "Participation",
    desc: "You get an achievement just for creating an account, you special snowflake!",
}, {
    slug: "fo_fo_fo",
    name: "Fo Fo Fo",
    desc: "Go 16-0 in the playoffs.",
}, {
    slug: "septuawinarian",
    name: "Septuawinarian",
    desc: "Win 70+ games in the regular season.",
}, {
    slug: "98_degrees",
    name: "98 Degrees",
    desc: "Go 98-0 in the playoffs and regular season.",
}, {
    slug: "dynasty",
    name: "Dynasty",
    desc: "Win 6 championships in 8 years.",
}, {
    slug: "dynasty_2",
    name: "Dynasty 2",
    desc: "Win 8 championships in a row.",
}, {
    slug: "dynasty_3",
    name: "Dynasty 3",
    desc: "Win 11 championships in 13 years.",
}, {
    slug: "moneyball",
    name: "Moneyball",
    desc: "Win a title with a payroll under $60 million.",
}, {
    slug: "moneyball_2",
    name: "Moneyball 2",
    desc: "Win a title with a payroll under $45 million.",
}, {
    slug: "hardware_store",
    name: "Hardware Store",
    desc: "Players on your team win MVP, DPOY, SMOY, ROY, and Finals MVP in the same season.",
}, {
    slug: "small_market",
    name: "Small Market",
    desc: "Win a title in a city with under 2 million people.",
}, {
    slug: "sleeper_pick",
    name: "Sleeper Pick",
    desc: "Use a non-lottery pick to draft the ROY.",
}, {
    slug: "hacker",
    name: "Hacker",
    desc: 'Privately <a href="https://basketball-gm.com/contact/">report</a> a security issue in <a href="https://bitbucket.org/dumbmatter/bbgm-account">the account system</a> or some other part of the site.',
}];

/**
 * Records one or more achievements.
 *
 * If logged in, try to record remotely and fall back to IndexedDB if necessary. If not logged in, just write to IndexedDB. Then, create a notification.
 *
 * @memberOf util.helpers
 * @param {Array.<string>} achievements Array of achievement IDs (see allAchievements above).
 * @param {boolean=} silent If true, don't show any notifications (like if achievements are only being moved from IDB to remote). Default false.
 * @return {Promise}
 */
async function addAchievements(achievements, silent = false) {
    const notify = slug => {
        if (silent) {
            return;
        }

        // Find name of achievement
        for (let i = 0; i < allAchievements.length; i++) {
            if (allAchievements[i].slug === slug) {
                eventLog.add(null, {
                    type: "achievement",
                    text: `"${allAchievements[i].name}" achievement awarded! <a href="/account">View all achievements.</a>`,
                });
                break;
            }
        }
    };

    const addToIndexedDB = achievements => {
        return g.dbm.tx("achievements", "readwrite", async tx => {
            for (const achievement of achievements) {
                await tx.achievements.add({slug: achievement});
                notify(achievement);
            }
        });
    };

    try {
        const data = await Promise.resolve($.ajax({
            type: "POST",
            url: `//account.basketball-gm.${g.tld}/add_achievements.php`,
            data: {achievements, sport: g.sport},
            dataType: "json",
            xhrFields: {
                withCredentials: true,
            },
        }));

        if (data.success) {
            achievements.forEach(notify);
        } else {
            return addToIndexedDB(achievements);
        }
    } catch (err) {
        return addToIndexedDB(achievements);
    }
}

async function check() {
    try {
        const data = await Promise.resolve($.ajax({
            type: "GET",
            url: `//account.basketball-gm.${g.tld}/user_info.php`,
            data: `sport=${g.sport}`,
            dataType: "json",
            xhrFields: {
                withCredentials: true,
            },
        }));

        // Save username for display

        g.emitter.emit('updateTopMenu', {
            email: data.email,
            goldCancelled: data.gold_cancelled,
            goldUntil: data.gold_until,
            username: data.username,
        });

        // No ads for Gold members
        const currentTimestamp = Math.floor(Date.now() / 1000);
        if (data.gold_cancelled || currentTimestamp > data.gold_until) {
            document.getElementById('banner-ad-top-wrapper').innerHTML = '<div id="banner-ad-top" style="text-align: center; min-height: 95px; margin-top: 1em"></div>';
            document.getElementById('banner-ad-bottom-wrapper').innerHTML = '<div id="banner-ad-bottom" style="text-align: center; min-height: 95px"></div>';
            ads.showBanner();
        }

        // If user is logged in, upload any locally saved achievements
        if (data.username !== "") {
            await g.dbm.tx("achievements", "readwrite", async tx => {
                let achievements = await tx.achievements.getAll();
                achievements = achievements.map(achievement => achievement.slug);

                // If any exist, delete and upload
                if (achievements.length > 0) {
                    await tx.achievements.clear();
                    // If this fails to save remotely, will be added to IDB again
                    await addAchievements(achievements, true);
                }
            });
        }
    } catch (err) {
        // Don't freak out if an AJAX request fails or whatever
        console.log(err);
    }
}

async function getAchievements() {
    const achievements = allAchievements.slice();
    const achievementsLocal = await g.dbm.achievements.getAll();

    // Initialize counts
    for (let i = 0; i < achievements.length; i++) {
        achievements[i].count = 0;
    }

    // Handle any achivements stored in IndexedDB
    for (let j = 0; j < achievementsLocal.length; j++) {
        for (let i = 0; i < achievements.length; i++) {
            if (achievements[i].slug === achievementsLocal[j].slug) {
                achievements[i].count += 1;
            }
        }
    }

    try {
        // Handle any achievements stored in the cloud
        const achievementsRemote = await Promise.resolve($.ajax({
            type: "GET",
            url: `//account.basketball-gm.${g.tld}/get_achievements.php`,
            data: `sport=${g.sport}`,
            dataType: "json",
            xhrFields: {
                withCredentials: true,
            },
        }));

        // Merge local and remote achievements
        for (let i = 0; i < achievements.length; i++) {
            achievements[i].count += achievementsRemote[achievements[i].slug] !== undefined ? achievementsRemote[achievements[i].slug] : 0;
        }
    } finally {
        // If remote fails, this will be just local. Otherwise it will merge.
        return achievements;
    }
}

// FOR EACH checkAchievement FUNCTION:
// Returns a promise that resolves to true or false depending on whether the achievement was awarded.
// HOWEVER, it's only saved to the database if saveAchievement is true (this is the default), but the saving happens asynchronously. It is theoretically possible that this could cause a notification to be displayed to the user about getting an achievement, but some error occurs when saving it.
const checkAchievement = {};

checkAchievement.fo_fo_fo = async (saveAchievement = true) => {
    if (g.godModeInPast) {
        return false;
    }

    const playoffSeries = await g.dbl.playoffSeries.get(g.season);
    const series = playoffSeries.series;

    for (let round = 0; round < series.length; round++) {
        let found = false;
        for (let i = 0; i < series[round].length; i++) {
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
            return false;
        }
    }

    if (saveAchievement) {
        addAchievements(["fo_fo_fo"]);
    }
    return true;
};

checkAchievement.septuawinarian = async (saveAchievement = true) => {
    if (g.godModeInPast) {
        return false;
    }

    const t = await team.filter({
        seasonAttrs: ["won"],
        season: g.season,
        tid: g.userTid,
    });

    if (t.won >= 70) {
        if (saveAchievement) {
            addAchievements(["septuawinarian"]);
        }
        return true;
    }

    return false;
};

checkAchievement["98_degrees"] = async (saveAchievement = true) => {
    if (g.godModeInPast) {
        return false;
    }

    const awarded = await checkAchievement.fo_fo_fo(false);
    if (awarded) {
        const t = await team.filter({
            seasonAttrs: ["won", "lost"],
            season: g.season,
            tid: g.userTid,
        });
        if (t.won === 82 && t.lost === 0) {
            if (saveAchievement) {
                addAchievements(["98_degrees"]);
            }
            return true;
        }

        return false;
    }

    return false;
};

async function checkDynasty(titles, years, slug, saveAchievement) {
    if (g.godModeInPast) {
        return false;
    }

    const teamSeasons = await g.dbl.teamSeasons.index("tid, season").getAll(backboard.bound([g.userTid], [g.userTid, '']));

    let titlesFound = 0;
    // Look over past years
    for (let i = 0; i < years; i++) {
        // Don't overshoot
        if (teamSeasons.length - 1 - i < 0) {
            break;
        }

        // Won title?
        if (teamSeasons[teamSeasons.length - 1 - i].playoffRoundsWon === g.numPlayoffRounds) {
            titlesFound += 1;
        }
    }

    if (titlesFound >= titles) {
        if (saveAchievement) {
            addAchievements([slug]);
        }
        return true;
    }

    return false;
}

checkAchievement.dynasty = (saveAchievement = true) => checkDynasty(6, 8, "dynasty", saveAchievement);
checkAchievement.dynasty_2 = (saveAchievement = true) => checkDynasty(8, 8, "dynasty_2", saveAchievement);
checkAchievement.dynasty_3 = (saveAchievement = true) => checkDynasty(11, 13, "dynasty_3", saveAchievement);

async function checkMoneyball(maxPayroll, slug, saveAchievement) {
    if (g.godModeInPast) {
        return false;
    }

    const t = await team.filter({
        seasonAttrs: ["expenses", "playoffRoundsWon"],
        season: g.season,
        tid: g.userTid,
    });

    if (t.playoffRoundsWon === g.numPlayoffRounds && t.expenses.salary.amount <= maxPayroll) {
        if (saveAchievement) {
            addAchievements([slug]);
        }
        return true;
    }

    return false;
}

checkAchievement.moneyball = (saveAchievement = true) => checkMoneyball(60000, "moneyball", saveAchievement);

checkAchievement.moneyball_2 = (saveAchievement = true) => checkMoneyball(45000, "moneyball_2", saveAchievement);

checkAchievement.hardware_store = async (saveAchievement = true) => {
    if (g.godModeInPast) {
        return false;
    }

    const awards = await g.dbl.awards.get(g.season);

    if (awards.mvp.tid === g.userTid && awards.dpoy.tid === g.userTid && awards.smoy.tid === g.userTid && awards.roy.tid === g.userTid && awards.finalsMvp.tid === g.userTid) {
        if (saveAchievement) {
            addAchievements(["hardware_store"]);
        }
        return true;
    }

    return false;
};

checkAchievement.small_market = async (saveAchievement = true) => {
    if (g.godModeInPast) {
        return false;
    }

    const t = await team.filter({
        seasonAttrs: ["playoffRoundsWon", "pop"],
        season: g.season,
        tid: g.userTid,
    });

    if (t.playoffRoundsWon === g.numPlayoffRounds && t.pop <= 2) {
        if (saveAchievement) {
            addAchievements(["small_market"]);
        }
        return true;
    }

    return false;
};

checkAchievement.sleeper_pick = async (saveAchievement = true) => {
    if (g.godModeInPast) {
        return false;
    }

    const awards = await g.dbl.awards.get(g.season);
    if (awards && awards.roy && awards.roy.tid === g.userTid) {
        const p = await g.dbl.players.get(awards.roy.pid);
        if (p.tid === g.userTid && p.draft.tid === g.userTid && p.draft.year === g.season - 1 && (p.draft.round > 1 || p.draft.pick >= 15)) {
            if (saveAchievement) {
                addAchievements(["sleeper_pick"]);
            }
            return true;
        }
    }

    return false;
};

module.exports = {
    check,
    getAchievements,
    addAchievements,
    checkAchievement,
};
