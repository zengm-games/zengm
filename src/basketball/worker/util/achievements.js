import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type { Achievement } from "../../../deion/common/types";

const checkDynasty = async (titles: number, years: number) => {
    const teamSeasons = await idb.getCopies.teamSeasons({
        tid: g.userTid,
        seasons: [g.season - (years - 1), Infinity],
    });

    let titlesFound = 0;
    // Look over past years
    for (let i = 0; i < years; i++) {
        // Don't overshoot
        if (teamSeasons.length - 1 - i < 0) {
            break;
        }

        // Won title?
        if (
            teamSeasons[teamSeasons.length - 1 - i].playoffRoundsWon ===
            g.numGamesPlayoffSeries.length
        ) {
            titlesFound += 1;
        }
    }

    return titlesFound >= titles;
};

const checkFoFoFo = async () => {
    if (g.numGamesPlayoffSeries.length < 3) {
        return false;
    }

    const playoffSeries = await idb.cache.playoffSeries.get(g.season);
    if (playoffSeries === undefined) {
        // Should only happen if playoffs are skipped
        return false;
    }

    for (const round of playoffSeries.series) {
        let found = false;
        for (const series of round) {
            if (
                series.away &&
                series.home &&
                series.away.won >= 4 &&
                series.home.won === 0 &&
                series.away.tid === g.userTid
            ) {
                found = true;
                break;
            }
            if (
                series.away &&
                series.home &&
                series.home.won >= 4 &&
                series.away.won === 0 &&
                series.home.tid === g.userTid
            ) {
                found = true;
                break;
            }
        }
        if (!found) {
            return false;
        }
    }

    return true;
};

async function checkMoneyball(maxPayroll) {
    const t = await idb.getCopy.teamsPlus({
        seasonAttrs: ["expenses", "playoffRoundsWon"],
        season: g.season,
        tid: g.userTid,
    });

    return (
        t &&
        t.seasonAttrs &&
        t.seasonAttrs.playoffRoundsWon === g.numGamesPlayoffSeries.length &&
        t.seasonAttrs.expenses.salary.amount <= maxPayroll
    );
}

const getUserSeed = async () => {
    const playoffSeries = await idb.getCopy.playoffSeries({
        season: g.season,
    });
    if (playoffSeries === undefined) {
        return;
    }

    for (const matchup of playoffSeries.series[0]) {
        if (matchup.away.tid === g.userTid) {
            return matchup.away.seed;
        }
        if (matchup.home.tid === g.userTid) {
            return matchup.home.seed;
        }
    }
};

const userWonTitle = async () => {
    const t = await idb.getCopy.teamsPlus({
        seasonAttrs: ["playoffRoundsWon"],
        season: g.season,
        tid: g.userTid,
    });

    return t.seasonAttrs.playoffRoundsWon === g.numGamesPlayoffSeries.length;
};

const checkGoldenOldies = async age => {
    const wonTitle = await userWonTitle();
    if (!wonTitle) {
        return false;
    }

    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        g.userTid,
    );

    for (const p of players) {
        const playerAge = g.season - p.born.year;
        if (playerAge < age) {
            return false;
        }
    }

    return true;
};

const checkYoungGuns = async age => {
    const wonTitle = await userWonTitle();
    if (!wonTitle) {
        return false;
    }

    const players = await idb.cache.players.indexGetAll(
        "playersByTid",
        g.userTid,
    );

    for (const p of players) {
        const playerAge = g.season - p.born.year;
        if (playerAge > age) {
            return false;
        }
    }

    return true;
};

const states = [
    "AL",
    "AK",
    "AZ",
    "AR",
    "CA",
    "CO",
    "CT",
    "DC",
    "DE",
    "FL",
    "GA",
    "HI",
    "ID",
    "IL",
    "IN",
    "IA",
    "KS",
    "KY",
    "LA",
    "ME",
    "MD",
    "MA",
    "MI",
    "MN",
    "MS",
    "MO",
    "MT",
    "NE",
    "NV",
    "NH",
    "NJ",
    "NM",
    "NY",
    "NC",
    "ND",
    "OH",
    "OK",
    "OR",
    "PA",
    "RI",
    "SC",
    "SD",
    "TN",
    "TX",
    "UT",
    "VT",
    "VA",
    "WA",
    "WV",
    "WI",
    "WY",
];
const isAmerican = loc => {
    if (loc.endsWith("USA")) {
        return true;
    }

    const parts = loc.split(", ");
    const state = parts[parts.length - 1];
    return states.includes(state);
};

const checkSevenGameFinals = async () => {
    // Confirm 4-3 finals
    const playoffSeries = await idb.getCopy.playoffSeries({
        season: g.season,
    });
    if (playoffSeries === undefined) {
        return false;
    }
    const matchup = playoffSeries.series[playoffSeries.series.length - 1][0];
    if (
        matchup === undefined ||
        matchup.home === undefined ||
        matchup.away === undefined
    ) {
        return false;
    }
    if (matchup.home.won < 3 || matchup.away.won < 3) {
        return false;
    }

    return true;
};

// IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
const achievements: Achievement[] = [
    {
        slug: "participation",
        name: "Participation",
        desc:
            "You get an achievement just for creating an account, you special snowflake!",
        category: "Meta",
    },
    {
        slug: "fo_fo_fo",
        name: "Fo Fo Fo",
        desc: "Go 16-0 in the playoffs.",
        category: "Playoffs",
        check: checkFoFoFo,
        when: "afterPlayoffs",
    },
    {
        slug: "fo_fo_fo_2",
        name: "Fo Fo Fo 2",
        desc: "Go 16-0 in the playoffs, without the #1 seed.",
        category: "Playoffs",
        async check() {
            const foFoFo = await checkFoFoFo();
            if (!foFoFo) {
                return false;
            }

            const seed = await getUserSeed();
            return seed > 1;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "septuawinarian",
        name: "Septuawinarian",
        desc: "Win 70+ games in the regular season.",
        category: "Season",
        async check() {
            const t = await idb.getCopy.teamsPlus({
                seasonAttrs: ["won"],
                season: g.season,
                tid: g.userTid,
            });

            return t && t.seasonAttrs && t.seasonAttrs.won >= 70;
        },
        when: "afterRegularSeason",
    },
    {
        slug: "98_degrees",
        name: "98 Degrees",
        desc: "Go 98-0 in the playoffs and regular season.",
        category: "Season",
        async check() {
            const awarded = await checkFoFoFo();
            if (awarded) {
                const t = await idb.getCopy.teamsPlus({
                    seasonAttrs: ["won", "lost"],
                    season: g.season,
                    tid: g.userTid,
                });
                if (
                    t &&
                    t.seasonAttrs &&
                    t.seasonAttrs.won === 82 &&
                    t.seasonAttrs.lost === 0
                ) {
                    return true;
                }
            }

            return false;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "dynasty",
        name: "Dynasty",
        desc: "Win 6 championships in 8 years.",
        category: "Multiple Seasons",
        check() {
            return checkDynasty(6, 8);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "dynasty_2",
        name: "Dynasty 2",
        desc: "Win 8 championships in a row.",
        category: "Multiple Seasons",
        check() {
            return checkDynasty(8, 8);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "dynasty_3",
        name: "Dynasty 3",
        desc: "Win 11 championships in 13 years.",
        category: "Multiple Seasons",
        check() {
            return checkDynasty(11, 13);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "moneyball",
        name: "Moneyball",
        desc: "Win a title with a payroll under 2/3 of the salary cap.",
        category: "Season",
        check() {
            return checkMoneyball((2 / 3) * g.salaryCap);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "moneyball_2",
        name: "Moneyball 2",
        desc: "Win a title with a payroll under half of the salary cap.",
        category: "Season",
        check() {
            return checkMoneyball(0.5 * g.salaryCap);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "hardware_store",
        name: "Hardware Store",
        desc:
            "Players on your team win MVP, DPOY, SMOY, MIP, ROY, and Finals MVP in the same season.",
        category: "Awards",
        async check() {
            const awards = await idb.cache.awards.get(g.season);

            return (
                awards &&
                awards.mvp &&
                awards.dpoy &&
                awards.smoy &&
                awards.mip &&
                awards.roy &&
                awards.finalsMvp &&
                awards.mvp.tid === g.userTid &&
                awards.dpoy.tid === g.userTid &&
                awards.smoy.tid === g.userTid &&
                awards.mip.tid === g.userTid &&
                awards.roy.tid === g.userTid &&
                awards.finalsMvp.tid === g.userTid
            );
        },
        when: "afterAwards",
    },
    {
        slug: "small_market",
        name: "Small Market",
        desc: "Win a title in a city with under 2 million people.",
        category: "Season",
        async check() {
            const t = await idb.getCopy.teamsPlus({
                seasonAttrs: ["playoffRoundsWon", "pop"],
                season: g.season,
                tid: g.userTid,
            });

            return (
                t &&
                t.seasonAttrs &&
                t.seasonAttrs.playoffRoundsWon ===
                    g.numGamesPlayoffSeries.length &&
                t.seasonAttrs.pop <= 2
            );
        },
        when: "afterPlayoffs",
    },
    {
        slug: "sleeper_pick",
        name: "Sleeper Pick",
        desc: "Use a non-lottery pick to draft the ROY.",
        category: "Draft",
        async check() {
            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.roy && awards.roy.tid === g.userTid) {
                const p = await idb.cache.players.get(awards.roy.pid);
                if (
                    p.tid === g.userTid &&
                    p.draft.tid === g.userTid &&
                    p.draft.year === g.season - 1 &&
                    (p.draft.round > 1 || p.draft.pick >= 15)
                ) {
                    return true;
                }
            }

            return false;
        },
        when: "afterAwards",
    },
    {
        slug: "sleeper_pick 2",
        name: "Sleeper Pick 2",
        desc: "Use a second round pick to draft the ROY.",
        category: "Draft",
        async check() {
            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.roy && awards.roy.tid === g.userTid) {
                const p = await idb.cache.players.get(awards.roy.pid);
                if (
                    p.tid === g.userTid &&
                    p.draft.tid === g.userTid &&
                    p.draft.year === g.season - 1 &&
                    p.draft.round > 1
                ) {
                    return true;
                }
            }

            return false;
        },
        when: "afterAwards",
    },
    {
        slug: "hacker",
        name: "Hacker",
        desc:
            "Privately report a security issue in the account system or some other part of the site.",
        category: "Meta",
    },
    {
        slug: "longevity",
        name: "Longevity",
        desc: "Play 100 seasons in a single league.",
        category: "Multiple Seasons",
        async check() {
            return g.season === g.startingSeason + 99;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "longevity_2",
        name: "Longevity 2",
        desc: "Play 1,000 seasons in a single league.",
        category: "Multiple Seasons",
        async check() {
            return g.season === g.startingSeason + 999;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "longevity_3",
        name: "Longevity 3",
        desc: "Play 10,000 seasons in a single league.",
        category: "Multiple Seasons",
        async check() {
            return g.season === g.startingSeason + 9999;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "clutch_finish",
        name: "Clutch Finish",
        desc: "Win game 7 of the finals in OT.",
        category: "Playoffs",
        async check() {
            const sevenGameFinals = await checkSevenGameFinals();
            if (!sevenGameFinals) {
                return false;
            }

            const games = await idb.cache.games.getAll();
            const game = games[games.length - 1]; // Last game of finals
            return game.overtimes >= 1 && game.won.tid === g.userTid;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "unclutch_finish",
        name: "Unclutch Finish",
        desc: "Lose game 7 of the finals in OT.",
        category: "Playoffs",
        async check() {
            const sevenGameFinals = await checkSevenGameFinals();
            if (!sevenGameFinals) {
                return false;
            }

            const games = await idb.cache.games.getAll();
            const game = games[games.length - 1]; // Last game of finals
            return game.overtimes >= 1 && game.lost.tid === g.userTid;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "underdog",
        name: "Underdog",
        desc: "Win a title as the 8th seed.",
        category: "Playoffs",
        async check() {
            const wonTitle = await userWonTitle();
            if (!wonTitle) {
                return false;
            }

            const seed = await getUserSeed();
            return seed === 8;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "trust_the_process",
        name: "Trust The Process",
        desc: "Have 3+ players on the All-Rookie Team.",
        category: "Awards",
        async check() {
            const awards = await idb.cache.awards.get(g.season);

            const count =
                awards && awards.allRookie
                    ? awards.allRookie.filter(p => p.tid === g.userTid).length
                    : 0;

            return count >= 3;
        },
        when: "afterAwards",
    },
    {
        slug: "international",
        name: "International",
        desc: "Win a title with no American players on your team.",
        category: "Team Composition",
        async check() {
            const wonTitle = await userWonTitle();
            if (!wonTitle) {
                return false;
            }

            const playersAll = await idb.cache.players.getAll();
            const countUSA = playersAll.filter(p => isAmerican(p.born.loc))
                .length;
            if (countUSA < playersAll.length / 2) {
                // Handle custom rosters where nobody is from the USA by enforcing that the league must be at least half USA for this achievement to apply
                return false;
            }

            const players = await idb.cache.players.indexGetAll(
                "playersByTid",
                g.userTid,
            );

            for (const p of players) {
                if (isAmerican(p.born.loc)) {
                    return false;
                }
            }

            return true;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "so_close",
        name: "So Close",
        desc: "Lose in the finals four seasons in a row.",
        category: "Playoffs",
        async check() {
            const teamSeasons = await idb.getCopies.teamSeasons({
                tid: g.userTid,
                seasons: [g.season - 3, g.season],
            });

            let count = 0;
            for (const teamSeason of teamSeasons) {
                if (
                    teamSeason.playoffRoundsWon ===
                    g.numGamesPlayoffSeries.length - 1
                ) {
                    count += 1;
                }
            }

            return count >= 4;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "team_effort",
        name: "Team Effort",
        desc: "Win a title without a player on an All-League Team.",
        category: "Awards",
        async check() {
            const wonTitle = await userWonTitle();
            if (!wonTitle) {
                return false;
            }

            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.allLeague) {
                for (const team of awards.allLeague) {
                    for (const p of team.players) {
                        if (p.tid === g.userTid) {
                            return false;
                        }
                    }
                }
            }

            return true;
        },
        when: "afterAwards",
    },
    {
        slug: "super_team",
        name: "Super Team",
        desc: "Have 3+ players on the All-League First Team.",
        category: "Awards",
        async check() {
            let count = 0;

            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.allLeague && awards.allLeague[0]) {
                for (const p of awards.allLeague[0].players) {
                    if (p.tid === g.userTid) {
                        count += 1;
                    }
                }
            }

            return count >= 3;
        },
        when: "afterAwards",
    },
    {
        slug: "brick_wall",
        name: "Brick Wall",
        desc: "Have 3+ players on the All-Defensive First Team.",
        category: "Awards",
        async check() {
            let count = 0;

            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.allDefensive && awards.allDefensive[0]) {
                for (const p of awards.allDefensive[0].players) {
                    if (p.tid === g.userTid) {
                        count += 1;
                    }
                }
            }

            return count >= 3;
        },
        when: "afterAwards",
    },
    {
        slug: "out_of_nowhere",
        name: "Out Of Nowhere",
        desc: "Have a player win both MIP and MVP in the same year.",
        category: "Awards",
        async check() {
            const awards = await idb.cache.awards.get(g.season);

            return (
                awards &&
                awards.mvp &&
                awards.mip &&
                awards.mvp.tid === g.userTid &&
                awards.mip.tid === g.userTid &&
                awards.mvp.pid === awards.mip.pid
            );
        },
        when: "afterAwards",
    },
    {
        slug: "quit_on_top",
        name: "Quit On Top",
        desc: "Have a player retire while making the All-League First Team.",
        category: "Awards",
        async check() {
            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.allLeague && awards.allLeague[0]) {
                for (const { pid, tid } of awards.allLeague[0].players) {
                    if (tid === g.userTid) {
                        const p = await idb.cache.players.get(pid);
                        if (p.retiredYear === g.season) {
                            return true;
                        }
                    }
                }
            }

            return false;
        },
        when: "afterAwards",
    },
    {
        slug: "golden_boy",
        name: "Golden Boy",
        desc: "Have a rookie make the All-League Team.",
        category: "Awards",
        async check() {
            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.allLeague) {
                for (const team of awards.allLeague) {
                    for (const { pid, tid } of team.players) {
                        if (tid === g.userTid) {
                            const p = await idb.cache.players.get(pid);
                            if (p.draft.year === g.season - 1) {
                                return true;
                            }
                        }
                    }
                }
            }

            return false;
        },
        when: "afterAwards",
    },
    {
        slug: "golden_boy_2",
        name: "Golden Boy 2",
        desc: "Have a rookie make the All-League First Team.",
        category: "Awards",
        async check() {
            const awards = await idb.cache.awards.get(g.season);
            if (awards && awards.allLeague && awards.allLeague[0]) {
                for (const { pid, tid } of awards.allLeague[0].players) {
                    if (tid === g.userTid) {
                        const p = await idb.cache.players.get(pid);
                        if (p.draft.year === g.season - 1) {
                            return true;
                        }
                    }
                }
            }

            return false;
        },
        when: "afterAwards",
    },
    {
        slug: "homegrown",
        name: "Homegrown",
        desc: "Win a title with only players you drafted.",
        category: "Team Composition",
        async check() {
            const wonTitle = await userWonTitle();
            if (!wonTitle) {
                return false;
            }

            const players = await idb.cache.players.indexGetAll(
                "playersByTid",
                g.userTid,
            );

            for (const p of players) {
                if (p.draft.tid !== g.userTid) {
                    return false;
                }
            }

            return true;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "golden_oldies",
        name: "Golden Oldies",
        desc: "Win a title when your entire team is at least 30 years old.",
        category: "Team Composition",
        async check() {
            const awarded = await checkGoldenOldies(30);

            return awarded;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "golden_oldies_2",
        name: "Golden Oldies 2",
        desc: "Win a title when your entire team is at least 33 years old.",
        category: "Team Composition",
        async check() {
            const awarded = await checkGoldenOldies(33);

            return awarded;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "golden_oldies_3",
        name: "Golden Oldies 3",
        desc: "Win a title when your entire team is at least 36 years old.",
        category: "Team Composition",
        async check() {
            const awarded = await checkGoldenOldies(36);

            return awarded;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "young_guns",
        name: "Young Guns",
        desc: "Win a title when your entire team is at most 25 years old.",
        category: "Team Composition",
        async check() {
            const awarded = await checkYoungGuns(25);

            return awarded;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "young_guns_2",
        name: "Young Guns 2",
        desc: "Win a title when your entire team is at most 22 years old.",
        category: "Team Composition",
        async check() {
            const awarded = await checkYoungGuns(22);

            return awarded;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "finals_choke",
        name: "Finals Choke",
        desc: "Blow a 3-0 lead in the finals.",
        category: "Playoffs",
        async check() {
            // Confirm lost finals
            const t = await idb.getCopy.teamsPlus({
                seasonAttrs: ["playoffRoundsWon"],
                season: g.season,
                tid: g.userTid,
            });
            if (
                t.seasonAttrs.playoffRoundsWon !==
                g.numGamesPlayoffSeries.length - 1
            ) {
                return false;
            }

            const sevenGameFinals = await checkSevenGameFinals();
            if (!sevenGameFinals) {
                return false;
            }

            // Confirm lost last 4 games
            const games = await idb.cache.games.getAll();
            const last4 = games.slice(-4);
            for (const game of last4) {
                if (game.lost.tid !== g.userTid) {
                    return false;
                }
            }

            return true;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "first_round_choke",
        name: "First Round Choke",
        desc: "Lose in the first round of the playoffs as the #1 seed.",
        category: "Playoffs",
        async check() {
            // Confirm lost in first round
            const t = await idb.getCopy.teamsPlus({
                seasonAttrs: ["playoffRoundsWon"],
                season: g.season,
                tid: g.userTid,
            });
            if (t.seasonAttrs.playoffRoundsWon !== 0) {
                return false;
            }

            const seed = await getUserSeed();
            return seed === 1;
        },
        when: "afterPlayoffs",
    },
    {
        slug: "bittersweet_victoy",
        name: "Bittersweet Victory",
        desc: "Get fired the same year you won a title.",
        category: "Playoffs",
        check: userWonTitle,
        when: "afterFired",
    },
];

export default achievements;
