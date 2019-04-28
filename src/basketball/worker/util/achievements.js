import { idb } from "../../../deion/worker/db";
import { g } from "../../../deion/worker/util";
import type { Achievement } from "../../../deion/common/types";

async function checkDynasty(titles: number, years: number) {
    if (g.easyDifficultyInPast || g.godModeInPast) {
        return false;
    }

    const teamSeasons = await idb.getCopies.teamSeasons({ tid: g.userTid });

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
}

const checkFoFoFo = async () => {
    if (g.easyDifficultyInPast || g.godModeInPast) {
        return false;
    }

    if (g.numGamesPlayoffSeries.length < 3) {
        return false;
    }

    const playoffSeries = await idb.getCopy.playoffSeries({ season: g.season });
    if (playoffSeries === undefined) {
        // Should only happen if playoffs are skipped
        return false;
    }

    for (const round of playoffSeries.series) {
        let found = false;
        for (const series of round) {
            if (
                series.away &&
                series.away.won >= 4 &&
                series.home.won === 0 &&
                series.away.tid === g.userTid
            ) {
                found = true;
                break;
            }
            if (
                (!series.away ||
                    (series.home.won >= 4 && series.away.won === 0)) &&
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
    if (g.easyDifficultyInPast || g.godModeInPast) {
        return false;
    }
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

// IF YOU ADD TO THIS you also need to add to the whitelist in add_achievements.php
const achievements: Achievement[] = [
    {
        slug: "participation",
        name: "Participation",
        desc:
            "You get an achievement just for creating an account, you special snowflake!",
    },
    {
        slug: "fo_fo_fo",
        name: "Fo Fo Fo",
        desc: "Go 16-0 in the playoffs.",
        check: checkFoFoFo,
        when: "afterPlayoffs",
    },
    {
        slug: "septuawinarian",
        name: "Septuawinarian",
        desc: "Win 70+ games in the regular season.",
        async check() {
            if (g.easyDifficultyInPast || g.godModeInPast) {
                return false;
            }

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
        async check() {
            if (g.easyDifficultyInPast || g.godModeInPast) {
                return false;
            }

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
        check() {
            return checkDynasty(6, 8);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "dynasty_2",
        name: "Dynasty 2",
        desc: "Win 8 championships in a row.",
        check() {
            return checkDynasty(8, 8);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "dynasty_3",
        name: "Dynasty 3",
        desc: "Win 11 championships in 13 years.",
        check() {
            return checkDynasty(11, 13);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "moneyball",
        name: "Moneyball",
        desc: "Win a title with a payroll under 2/3 of the salary cap.",
        check() {
            return checkMoneyball((2 / 3) * g.salaryCap);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "moneyball_2",
        name: "Moneyball 2",
        desc: "Win a title with a payroll under half of the salary cap.",
        check() {
            return checkMoneyball(0.5 * g.salaryCap);
        },
        when: "afterPlayoffs",
    },
    {
        slug: "hardware_store",
        name: "Hardware Store",
        desc:
            "Players on your team win MVP, DPOY, SMOY, ROY, and Finals MVP in the same season.",
        async check() {
            if (g.easyDifficultyInPast || g.godModeInPast) {
                return false;
            }

            const awards = await idb.getCopy.awards({ season: g.season });

            return (
                awards &&
                awards.mvp &&
                awards.dpoy &&
                awards.smoy &&
                awards.roy &&
                awards.finalsMvp &&
                awards.mvp.tid === g.userTid &&
                awards.dpoy.tid === g.userTid &&
                awards.smoy.tid === g.userTid &&
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
        async check() {
            if (g.easyDifficultyInPast || g.godModeInPast) {
                return false;
            }

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
        async check() {
            if (g.easyDifficultyInPast || g.godModeInPast) {
                return false;
            }

            const awards = await idb.getCopy.awards({ season: g.season });
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
        slug: "hacker",
        name: "Hacker",
        desc:
            "Privately report a security issue in the account system or some other part of the site.",
    },
];

export default achievements;
