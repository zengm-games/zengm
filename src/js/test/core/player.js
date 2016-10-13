/*eslint no-unused-expressions: 0*/
import assert from 'assert';
import _ from 'underscore';
import g from '../../globals';
import * as player from '../../core/player';
import * as helpers from '../../util/helpers';

// Synchronous version of player.addStatsRow which does not require IndexedDB
const addStatsRow = (p, playoffs = false) => {
    p.stats.push({season: g.season, tid: p.tid, playoffs, gp: 0, gs: 0, min: 0, fg: 0, fga: 0, fgAtRim: 0, fgaAtRim: 0, fgLowPost: 0, fgaLowPost: 0, fgMidRange: 0, fgaMidRange: 0, tp: 0, tpa: 0, ft: 0, fta: 0, orb: 0, drb: 0, trb: 0, ast: 0, tov: 0, stl: 0, blk: 0, pf: 0, pts: 0, per: 0, ewa: 0});
    p.statsTids.push(p.tid);
    p.statsTids = _.uniq(p.statsTids);

    return p;
};

// Default values needed
g.teamAbbrevsCache = helpers.getTeamsDefault().map(t => t.abbrev);
g.numTeams = 30;
g.userTids = [0];

describe("core/player", () => {
    describe("#generate()", () => {
        it.skip("should add stats row only for players generated on teams, not free agents or undrafted players", () => {
// Needs DB to check since stats are not in player object anymore
            let p = player.generate(-2, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 0);

            p = player.generate(-1, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 0);

            p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 1);

            p = player.generate(15, 19, "", 25, 55, 2012, false, 15.5);
            assert.equal(p.stats.length, 1);
        });
    });

    describe("#madeHof()", () => {
        it("should correctly assign players to the Hall of Fame", () => {
            // Like player from http://www.reddit.com/r/BasketballGM/comments/222k8b/so_a_10x_dpoy_apparently_doesnt_have_what_it/
            const p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
            const playerStats = [{
                min: 1 * 2.6,
                per: 18.7,
                ewa: 0,
            }, {
                min: 77 * 19.3,
                per: 13,
                ewa: 1.1,
            }, {
                min: 82 * 26,
                per: 18.9,
                ewa: 6.6,
            }, {
                min: 82 * 33.9,
                per: 15.3,
                ewa: 4.7,
            }, {
                min: 79 * 33.8,
                per: 16,
                ewa: 5.3,
            }, {
                min: 81 * 31,
                per: 17.1,
                ewa: 6.1,
            }, {
                min: 80 * 28,
                per: 16.2,
                ewa: 4.6,
            }, {
                min: 82 * 34.1,
                per: 16.6,
                ewa: 6.2,
            }, {
                min: 80 * 34.8,
                per: 16.9,
                ewa: 6.5,
            }, {
                min: 82 * 31.7,
                per: 17.8,
                ewa: 7,
            }, {
                min: 81 * 33.5,
                per: 18.8,
                ewa: 8.3,
            }, {
                min: 82 * 32,
                per: 17.8,
                ewa: 7,
            }, {
                min: 82 * 30.5,
                per: 17,
                ewa: 5.9,
            }, {
                min: 76 * 30.6,
                per: 16.3,
                ewa: 4.8,
            }, {
                min: 82 * 30.8,
                per: 16,
                ewa: 5,
            }, {
                min: 82 * 28,
                per: 15.6,
                ewa: 4.1,
            }];

            assert.equal(player.madeHof(p, playerStats), false);
        });
    });

    describe("#filter()", () => {
        let p;
        before(() => {
            g.season = 2011;
            p = player.generate(g.PLAYER.UNDRAFTED, 19, "", 50, 60, 2011, false, 28);
            p.stats = []; // Fake it being here
            p.tid = 4;

            g.season = 2012;
// Replace with static array of stats row in helper function addStatsRow
            p = addStatsRow(p);
            p = player.addRatingsRow(p, 15);

            p.contract.exp = g.season + 1;

            p.stats[0].gp = 5;
            p.stats[0].fg = 20;
            p = addStatsRow(p, true);
            p.stats[1].gp = 3;
            p.stats[1].fg = 30;
            p = addStatsRow(p);
            p.stats[2].season = 2013;
            p.stats[2].tid = 0;
            p.stats[2].gp = 8;
            p.stats[2].fg = 56;

            p = player.addRatingsRow(p, 15);
            p.ratings[2].season = 2013;
            p = player.addRatingsRow(p, 15);
            p.ratings[3].season = 2014;
        });

        it("should return requested info if tid/season match", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg", "fgp", "per"],
                tid: 4,
                season: 2012,
            });

            assert.equal(pf.tid, 4);
            assert.equal(pf.awards.length, 0);
            assert.equal(pf.ratings.season, 2012);
            assert.equal(typeof pf.ratings.ovr, "number");
            assert.equal(Object.keys(pf.ratings).length, 2);
            assert.equal(pf.stats.season, 2012);
            assert.equal(pf.stats.abbrev, "CIN");
            assert.equal(typeof pf.stats.fg, "number");
            assert.equal(typeof pf.stats.fgp, "number");
            assert.equal(typeof pf.stats.per, "number");
            assert.equal(Object.keys(pf.stats).length, 5);

            assert(!pf.hasOwnProperty("statsPlayoffs"));
            assert(!pf.hasOwnProperty("careerStats"));
            assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
        });
        it("should return requested info if tid/season match for an array of player objects", () => {
            const pf = player.filter([p, p], {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg", "fgp", "per"],
                tid: 4,
                season: 2012,
            });

            for (let i = 0; i < 2; i++) {
                assert.equal(pf[i].tid, 4);
                assert.equal(pf[i].awards.length, 0);
                assert.equal(pf[i].ratings.season, 2012);
                assert.equal(typeof pf[i].ratings.ovr, "number");
                assert.equal(Object.keys(pf[i].ratings).length, 2);
                assert.equal(pf[i].stats.season, 2012);
                assert.equal(pf[i].stats.abbrev, "CIN");
                assert.equal(typeof pf[i].stats.fg, "number");
                assert.equal(typeof pf[i].stats.fgp, "number");
                assert.equal(typeof pf[i].stats.per, "number");
                assert.equal(Object.keys(pf[i].stats).length, 5);

                assert(!pf[i].hasOwnProperty("statsPlayoffs"));
                assert(!pf[i].hasOwnProperty("careerStats"));
                assert(!pf[i].hasOwnProperty("careerStatsPlayoffs"));
            }
        });
        it("should return requested info if tid/season match, even when no attrs requested", () => {
            const pf = player.filter(p, {
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg", "fgp", "per"],
                tid: 4,
                season: 2012,
            });

            assert.equal(pf.ratings.season, 2012);
            assert.equal(typeof pf.ratings.ovr, "number");
            assert.equal(Object.keys(pf.ratings).length, 2);
            assert.equal(pf.stats.season, 2012);
            assert.equal(pf.stats.abbrev, "CIN");
            assert.equal(typeof pf.stats.fg, "number");
            assert.equal(typeof pf.stats.fgp, "number");
            assert.equal(typeof pf.stats.per, "number");
            assert.equal(Object.keys(pf.stats).length, 5);

            assert(!pf.hasOwnProperty("statsPlayoffs"));
            assert(!pf.hasOwnProperty("careerStats"));
            assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
        });
        it("should return requested info if tid/season match, even when no ratings requested", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                stats: ["season", "abbrev", "fg", "fgp", "per"],
                tid: 4,
                season: 2012,
            });

            assert.equal(pf.tid, 4);
            assert.equal(pf.awards.length, 0);
            assert(!pf.hasOwnProperty("ratings"));
            assert.equal(pf.stats.season, 2012);
            assert.equal(pf.stats.abbrev, "CIN");
            assert.equal(typeof pf.stats.fg, "number");
            assert.equal(typeof pf.stats.fgp, "number");
            assert.equal(typeof pf.stats.per, "number");
            assert.equal(Object.keys(pf.stats).length, 5);

            assert(!pf.hasOwnProperty("statsPlayoffs"));
            assert(!pf.hasOwnProperty("careerStats"));
            assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
        });
        it("should return requested info if tid/season match, even when no stats requested", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                tid: 4,
                season: 2012,
            });

            assert.equal(pf.tid, 4);
            assert.equal(pf.awards.length, 0);
            assert.equal(pf.ratings.season, 2012);
            assert.equal(typeof pf.ratings.ovr, "number");
            assert.equal(Object.keys(pf.ratings).length, 2);
            assert(!pf.hasOwnProperty("stats"));

            assert(!pf.hasOwnProperty("statsPlayoffs"));
            assert(!pf.hasOwnProperty("careerStats"));
            assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
        });
        it("should return undefined if tid does not match any on record", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg", "fgp", "per"],
                tid: 5,
                season: 2012,
            });

            assert.equal((typeof pf), "undefined");
        });
        it("should return undefined if season does not match any on record", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg", "fgp", "per"],
                tid: 4,
                season: 2014,
            });

            assert.equal((typeof pf), "undefined");
        });
        it("should return season totals is options.totals is true, and per-game averages otherwise", () => {
            let pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 4,
                season: 2012,
                totals: true,
            });
            assert.equal(pf.stats.gp, 5);
            assert.equal(pf.stats.fg, 20);

            pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 4,
                season: 2012,
            });
            assert.equal(pf.stats.gp, 5);
            assert.equal(pf.stats.fg, 4);
        });
        it("should return stats and statsPlayoffs if options.playoffs is true", () => {
            const pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 4,
                season: 2012,
                playoffs: true,
            });
            assert.equal(pf.stats.gp, 5);
            assert.equal(pf.stats.fg, 4);
            assert.equal(pf.statsPlayoffs.gp, 3);
            assert.equal(pf.statsPlayoffs.fg, 10);
        });
        it("should not return undefined with options.showNoStats even if tid does not match any on record", () => {
            const pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 5,
                season: 2012,
                showNoStats: true,
            });
            assert.equal((typeof pf), "object");
        });
        it("should return undefined with options.showNoStats if season does not match any on record", () => {
            const pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 4,
                season: 2015,
                showNoStats: true,
            });
            assert.equal((typeof pf), "undefined");
        });
        it("should not return undefined with options.showRookies if the player was drafted this season", () => {
            g.season = 2011;
            let pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 5,
                season: 2011,
                showRookies: true,
            });
            assert.equal((typeof pf), "object");

            g.season = 2015;
            pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 5,
                season: 2011,
                showRookies: true,
            });
            assert.equal((typeof pf), "undefined");

            g.season = 2012;
        });
        it("should fuzz ratings if options.fuzz is true", () => {
            let pf = player.filter(p, {
                ratings: ["ovr"],
                tid: 4,
                season: 2012,
                fuzz: false,
            });
            assert.equal(pf.ratings.ovr, p.ratings[1].ovr);

            pf = player.filter(p, {
                ratings: ["ovr"],
                tid: 4,
                season: 2012,
                fuzz: true,
            });
            // This will break if ovr + fuzz is over 100 (should check bounds), but that never happens in practice
            assert.equal(pf.ratings.ovr, Math.round(p.ratings[1].ovr + p.ratings[1].fuzz));
        });
        it("should return stats from previous season if options.oldStats is true and current season has no stats record", () => {
            g.season = 2013;
            let pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 0,
                season: 2013,
                oldStats: true,
            });
            assert.equal(pf.stats.gp, 8);
            assert.equal(pf.stats.fg, 7);

            g.season = 2014;
            pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 0,
                season: 2014,
                oldStats: true,
            });
            assert.equal(pf.stats.gp, 8);
            assert.equal(pf.stats.fg, 7);

            pf = player.filter(p, {
                stats: ["gp", "fg"],
                tid: 0,
                season: 2014,
                oldStats: false,
            });
            assert.equal((typeof pf), "undefined");

            g.season = 2012;
        });
        it("should adjust cashOwed by options.numGamesRemaining", () => {
            g.season = 2012;

            let pf = player.filter(p, {
                attrs: ["cashOwed"],
                tid: 4,
                season: 2012,
                numGamesRemaining: 82,
            });
            assert.equal(pf.cashOwed, p.contract.amount * 2 / 1000);

            pf = player.filter(p, {
                attrs: ["cashOwed"],
                tid: 4,
                season: 2012,
                numGamesRemaining: 41,
            });
            assert.equal(pf.cashOwed, p.contract.amount * 1.5 / 1000);

            pf = player.filter(p, {
                attrs: ["cashOwed"],
                tid: 4,
                season: 2012,
                numGamesRemaining: 0,
            });
            assert.equal(pf.cashOwed, p.contract.amount / 1000);
        });
        it("should return stats and ratings from all seasons and teams if no season or team is specified", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg"],
                totals: true,
            });

            assert.equal(pf.tid, 4);
            assert.equal(pf.awards.length, 0);
            assert.equal(pf.ratings[0].season, 2011);
            assert.equal(typeof pf.ratings[0].ovr, "number");
            assert.equal(pf.ratings[1].season, 2012);
            assert.equal(typeof pf.ratings[1].ovr, "number");
            assert.equal(pf.ratings[2].season, 2013);
            assert.equal(typeof pf.ratings[2].ovr, "number");
            assert.equal(pf.stats[0].season, 2012);
            assert.equal(pf.stats[0].abbrev, "CIN");
            assert.equal(pf.stats[0].fg, 20);
            assert.equal(pf.stats[1].season, 2013);
            assert.equal(pf.stats[1].abbrev, "ATL");
            assert.equal(pf.stats[1].fg, 56);
            assert.equal(pf.careerStats.fg, 76);

            assert(!pf.hasOwnProperty("statsPlayoffs"));
            assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
        });
        it("should return stats and ratings from all seasons with a specific team if no season is specified but a team is", () => {
            const pf = player.filter(p, {
                attrs: ["tid", "awards"],
                ratings: ["season", "ovr"],
                stats: ["season", "abbrev", "fg"],
                tid: 4,
                totals: true,
            });

            assert.equal(pf.tid, 4);
            assert.equal(pf.awards.length, 0);
            assert.equal(pf.ratings[0].season, 2012);
            assert.equal(typeof pf.ratings[0].ovr, "number");
            assert.equal(pf.ratings.length, 1);
            assert.equal(pf.stats[0].season, 2012);
            assert.equal(pf.stats[0].abbrev, "CIN");
            assert.equal(pf.stats[0].fg, 20);
            assert.equal(pf.stats.length, 1);
            assert.equal(pf.careerStats.fg, 20);

            assert(!pf.hasOwnProperty("statsPlayoffs"));
            assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
        });
    });
});
