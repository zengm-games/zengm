const assert = require('assert');
const db = require('../../db');
const g = require('../../globals');
const league = require('../../core/league');
const player = require('../../core/player');
const team = require('../../core/team');

describe("core/team", function () {
    describe("#findStarters()", function () {
        it("should handle easy roster sorts", function () {
            var starters;

            starters = team.findStarters(["PG", "SG", "SF", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters(["PG", "SG", "G", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters(["F", "SG", "SF", "PG", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters(["F", "SG", "SF", "PF", "G", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);
        });
        it("should put two Gs in starting lineup", function () {
            var starters;

            starters = team.findStarters(["PG", "F", "SF", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 5]);

            starters = team.findStarters(["F", "PF", "G", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 5]);

            starters = team.findStarters(["F", "PF", "SF", "GF", "C", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 8]);

            starters = team.findStarters(["F", "PF", "SF", "C", "C", "F", "FC", "PF", "PG", "G"]);
            assert.deepEqual(starters, [0, 1, 2, 8, 9]);
        });
        it("should put two Fs (or one F and one C) in starting lineup", function () {
            var starters;

            starters = team.findStarters(["PG", "SG", "G", "PF", "G", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 6]);

            starters = team.findStarters(["PG", "SG", "SG", "PG", "G", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 6, 7]);

            starters = team.findStarters(["PG", "SG", "SG", "PG", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 4, 6]);
        });
        it("should never put two pure Cs in starting lineup", function () {
            var starters;

            starters = team.findStarters(["PG", "SG", "G", "C", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 6]);

            starters = team.findStarters(["PG", "SG", "G", "C", "FC", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);
        });
    });
    describe("#filter()", function () {
        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 0, undefined, 2013, false);
            }).then(function () {
                return g.dbl.teamStats.index('season, tid').get([g.season, 4]).then(function (teamStats) {
                    teamStats.gp = 10;
                    teamStats.fg = 50;
                    teamStats.fga = 100;

                    return g.dbl.teamStats.put(teamStats);
                }).then(function () {
                    var teamStats = team.genStatsRow(4, true);
                    teamStats.gp = 4;
                    teamStats.fg = 12;
                    teamStats.fga = 120;

                    return g.dbl.teamStats.put(teamStats);
                });
            });
        });
        after(function () {
            return league.remove(g.lid);
        });

        it("should return requested info if tid/season match", function () {
            return team.filter({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won", "payroll"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season
            }).then(function (t) {
                assert.equal(t.tid, 4);
                assert.equal(t.abbrev, "CIN");
                assert.equal(t.season, g.season);
                assert.equal(t.won, 0);
                assert(t.payroll > 0);
                assert.equal(t.gp, 10);
                assert.equal(t.fg, 5);
                assert.equal(t.fgp, 50);
                assert.equal(Object.keys(t).length, 8);
                assert.equal(t.hasOwnProperty("stats"), false);
            });
        });
        it("should return an array if no team ID is specified", function () {
            return team.filter({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won"],
                stats: ["gp", "fg", "fgp"],
                season: g.season
            }).then(function (teams) {
                assert.equal(teams.length, g.numTeams);
                assert.equal(teams[4].tid, 4);
                assert.equal(teams[4].abbrev, "CIN");
                assert.equal(teams[4].season, g.season);
                assert.equal(teams[4].won, 0);
                assert.equal(teams[4].gp, 10);
                assert.equal(teams[4].fg, 5);
                assert.equal(teams[4].fgp, 50);
                assert.equal(Object.keys(teams[4]).length, 7);
                assert.equal(teams[4].hasOwnProperty("stats"), false);
            });
        });
        it("should return requested info if tid/season match, even when no attrs requested", function () {
            return team.filter({
                seasonAttrs: ["season", "won"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season
            }).then(function (t) {
                assert.equal(t.season, g.season);
                assert.equal(t.won, 0);
                assert.equal(t.gp, 10);
                assert.equal(t.fg, 5);
                assert.equal(t.fgp, 50);
                assert.equal(Object.keys(t).length, 5);
            });
        });
        it("should return requested info if tid/season match, even when no seasonAttrs requested", function () {
            return team.filter({
                attrs: ["tid", "abbrev"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season
            }).then(function (t) {
                assert.equal(t.tid, 4);
                assert.equal(t.abbrev, "CIN");
                assert.equal(t.gp, 10);
                assert.equal(t.fg, 5);
                assert.equal(t.fgp, 50);
                assert.equal(Object.keys(t).length, 5);
            });
        });
        it("should return requested info if tid/season match, even when no stats requested", function () {
            return team.filter({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won"],
                tid: 4,
                season: g.season
            }).then(function (t) {
                assert.equal(t.tid, 4);
                assert.equal(t.abbrev, "CIN");
                assert.equal(t.season, g.season);
                assert.equal(t.won, 0);
                assert.equal(Object.keys(t).length, 4);
            });
        });
        it("should return season totals is options.totals is true", function () {
            return team.filter({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                season: g.season,
                totals: true
            }).then(function (t) {
                assert.equal(t.gp, 10);
                assert.equal(t.fg, 50);
                assert.equal(t.fga, 100);
                assert.equal(t.fgp, 50);
            });
        });
        it("should return playoff stats if options.playoffs is true", function () {
            return team.filter({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                season: g.season,
                playoffs: true
            }).then(function (t) {
                assert.equal(t.gp, 4);
                assert.equal(t.fg, 3);
                assert.equal(t.fga, 30);
                assert.equal(t.fgp, 10);
            });
        });
        it("should use supplied IndexedDB transaction", function () {
            return g.dbl.tx(["players", "releasedPlayers", "teams", "teamSeasons"], function (tx) {
                return team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won"],
                    tid: 4,
                    season: g.season,
                    ot: tx
                }).then(function (t) {
                    assert.equal(t.tid, 4);
                    assert.equal(t.abbrev, "CIN");
                    assert.equal(t.season, g.season);
                    assert.equal(t.won, 0);
                    assert.equal(Object.keys(t).length, 4);

                    // If another transaction was used inside team.filter besides tx, this will cause an error because the transaction will no longer be active
                    return tx.players.get(0);
                });
            });
        });
        it("should return stats in an array if no season is specified", function () {
            return team.filter({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                playoffs: true
            }).then(function (t) {
                assert.equal(t.stats[0].gp, 4);
                assert.equal(t.stats[0].fg, 3);
                assert.equal(t.stats[0].fga, 30);
                assert.equal(t.stats[0].fgp, 10);
            });
        });
    });

    describe("#checkRosterSizes()", function () {
        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 0, undefined, 2013, false);
            });
        });
        after(function () {
            return league.remove(g.lid);
        });

        function addTen(tid) {
            return g.dbl.tx("players", "readwrite", function (tx) {
                var i = 0;

                return tx.players.index('tid').iterate(g.PLAYER.FREE_AGENT, function (p, shortCircuit) {
                    if (i >= 10) {
                        return shortCircuit();
                    }
                    i += 1;
                    p.tid = tid;
                    return p;
                });
            });
        }

        function removeTen(tid) {
            return g.dbl.tx(["players", "releasedPlayers", "teams", "teamSeasons"], "readwrite", function (tx) {
                var i = 0;

                return tx.players.index('tid').iterate(tid, function (p, shortCircuit) {
                    if (i >= 10) {
                        return shortCircuit();
                    }
                    i += 1;
                    return player.release(tx, p, false);
                });
            });
        }

        it("should add players to AI team under roster limit without returning error message", function () {
            return removeTen(5).then(function () {
                // Confirm roster size under limit
                return g.dbl.players.index('tid').count(5).then(function (numPlayers) {
                    assert.equal(numPlayers, 4);
                });
            }).then(function () {
                return team.checkRosterSizes().then(function (userTeamSizeError) {
                    assert.equal(userTeamSizeError, null);
                });
            }).then(function () {
                // Confirm players added up to limit
                return g.dbl.players.index('tid').count(5).then(function (numPlayers) {
                    assert.equal(numPlayers, g.minRosterSize);
                });
            });
        });
        it("should remove players to AI team over roster limit without returning error message", function () {
            return addTen(8).then(function () {
                // Confirm roster size over limit
                return g.dbl.players.index('tid').count(8).then(function (numPlayers) {
                    assert.equal(numPlayers, 24);
                });
            }).then(team.checkRosterSizes).then(function (userTeamSizeError) {
                // Confirm no error message and roster size pruned to limit
                assert.equal(userTeamSizeError, null);
                return g.dbl.players.index('tid').count(8).then(function (numPlayers) {
                    assert.equal(numPlayers, 15);
                });
            });
        });
        it("should return error message when user team is under roster limit", function () {
            return removeTen(g.userTid).then(function () {
                // Confirm roster size under limit
                return g.dbl.players.index('tid').count(g.userTid).then(function (numPlayers) {
                    assert.equal(numPlayers, 4);
                });
            }).then(team.checkRosterSizes).then(function (userTeamSizeError) {
                // Confirm roster size errora nd no auto-signing of players
                assert.equal(typeof userTeamSizeError, "string");
                assert(userTeamSizeError.indexOf("less") >= 0);
                assert(userTeamSizeError.indexOf("minimum") >= 0);
                return g.dbl.players.index('tid').count(g.userTid).then(function (numPlayers) {
                    assert.equal(numPlayers, 4);
                });
            });
        });
        it("should return error message when user team is over roster limit", function () {
            return addTen(g.userTid).then(function () {
                return addTen(g.userTid);
            }).then(function () {
                // Confirm roster size over limit
                return g.dbl.players.index('tid').count(g.userTid).then(function (numPlayers) {
                    assert.equal(numPlayers, 24);
                });
            }).then(team.checkRosterSizes).then(function (userTeamSizeError) {
                // Confirm roster size error and no auto-release of players
                assert.equal(typeof userTeamSizeError, "string");
                assert(userTeamSizeError.indexOf("more") >= 0);
                assert(userTeamSizeError.indexOf("maximum") >= 0);
                return g.dbl.players.index('tid').count(g.userTid).then(function (numPlayers) {
                    assert.equal(numPlayers, 24);
                });
            });
        });
    });
});
