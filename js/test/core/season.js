/**
 * @name test.core.season
 * @namespace Tests for core.season.
 */
define(["globals", "core/season", "util/helpers", "test/helpers", "dao", "lib/jquery", "lib/underscore", "lib/bluebird", "db", "core/league"], function (g, season, helpers, testHelpers, dao, $, _, Promise, db, league) {
    "use strict";

    var defaultTeams = helpers.getTeamsDefault();

    describe("core/season", function () {
        before(function() {
            g.teamAbbrevsCache = _.pluck(helpers.getTeamsDefault(), "abbrev");
            g.numTeams = 30;
        });
        describe("#newSchedule()", function () {
            it("should schedule 1230 games (82 each for 30 teams)", function () {
                season.newSchedule(defaultTeams).length.should.equal(1230);
            });
            it("should schedule 41 home games and 41 away games for each team", function () {
                var away, home, i, tids;

                tids = season.newSchedule(defaultTeams);

                home = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Number of home games for each team
                away = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // Number of away games for each team

                for (i = 0; i < tids.length; i++) {
                    home[tids[i][0]] += 1;
                    away[tids[i][1]] += 1;
                }

                for (i = 0; i < g.numTeams; i++) {
                    home[i].should.equal(41);
                    away[i].should.equal(41);
                }
            });
            it("should schedule each team one home game against every team in the other conference", function () {
                var home, i, teams, tids;

                tids = season.newSchedule(defaultTeams);

                home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
                for (i = 0; i < g.numTeams; i++) {
                    home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                }

                teams = helpers.getTeamsDefault();

                for (i = 0; i < tids.length; i++) {
                    if (teams[tids[i][0]].cid !== teams[tids[i][1]].cid) {
                        home[tids[i][1]][tids[i][0]] += 1;
                    }
                }

                for (i = 0; i < g.numTeams; i++) {
                    testHelpers.numInArrayEqualTo(home[i], 0).should.equal(15);
                    testHelpers.numInArrayEqualTo(home[i], 1).should.equal(15);
                }
            });
            it("should schedule each team two home games against every team in the same division", function () {
                var home, i, teams, tids;

                tids = season.newSchedule(defaultTeams);

                home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
                for (i = 0; i < g.numTeams; i++) {
                    home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                }

                teams = helpers.getTeamsDefault();

                for (i = 0; i < tids.length; i++) {
                    if (teams[tids[i][0]].did === teams[tids[i][1]].did) {
                        home[tids[i][1]][tids[i][0]] += 1;
                    }
                }

                for (i = 0; i < g.numTeams; i++) {
                    testHelpers.numInArrayEqualTo(home[i], 0).should.equal(26);
                    testHelpers.numInArrayEqualTo(home[i], 2).should.equal(4);
                }
            });
            it("should schedule each team one or two home games against every team in the same conference but not in the same division (one game: 2/10 teams; two games: 8/10 teams)", function () {
                var home, i, teams, tids;

                tids = season.newSchedule(defaultTeams);

                home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
                for (i = 0; i < g.numTeams; i++) {
                    home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                }

                teams = helpers.getTeamsDefault();

                for (i = 0; i < tids.length; i++) {
                    if (teams[tids[i][0]].cid === teams[tids[i][1]].cid && teams[tids[i][0]].did !== teams[tids[i][1]].did) {
                        home[tids[i][1]][tids[i][0]] += 1;
                    }
                }

                for (i = 0; i < g.numTeams; i++) {
                    testHelpers.numInArrayEqualTo(home[i], 0).should.equal(20);
                    testHelpers.numInArrayEqualTo(home[i], 1).should.equal(2);
                    testHelpers.numInArrayEqualTo(home[i], 2).should.equal(8);
                }
            });
        });
    });

    describe('core/season playoffs tiebreakers', function() {
        var tx;
        before(function() {
            return db.connectMeta().then(function () {
                return league.create("Test", 15, undefined, 2015, false);
            })
                .then(function() {
                    return Promise.try(function () {
                            return $.getJSON("../../data/sample_tiebreakers.json");
                        });
                })
                .then(function (teams) {
                    tx = dao.tx(["teams", "playoffSeries"], "readwrite");
                    return dao.teams.iterate({
                        ot: tx,
                        callback: function (t) {
                            t = teams.teams[t.tid]; // load static data
                            return t;
                        }
                    });
                })
        });
        after(function () {
            return league.remove(g.lid);
        });
        describe("#createPlayoffMatchups", function() {
            var pseries;
            before(function() {
                tx = dao.tx(["teams", "playoffSeries", "players", "playerStats", "events"], "readwrite");
                return season.createPlayoffMatchups(tx)
                    .then(function() {
                        return dao.playoffSeries.get({
                                ot: tx,
                                key: g.season
                            });
                    })
                    .then(function(series) {
                        pseries = series;
                    });
            });
            it("should rank teams with the same records properly.", function() {
                var r1 = pseries.series[0];

                // 13 and 26 tied for first, 26 is 1 seed, 13 is 2 seed,
                r1[0].home.tid.should.equal(26);
                r1[3].home.tid.should.equal(13);

                // 10 is 7, 18 is 6
                r1[7].away.tid.should.equal(10);
                r1[6].away.tid.should.equal(18);
            });
            it("should rank div leader in top 4 if option divLeaderTop4 is true", function() {
                g.divLeaderTop4 = true;
                return require('core/team').filter({
                    attrs: ['tid'],
                    sortBy: helpers.getPlayoffSorting(),
                    season: g.season
                }).then(function(teams) {
                    // 13 is ranked higher than 26 when drank is considered
                    teams[1].tid.should.equal(13);
                    teams[2].tid.should.equal(26);

                    // 5 is div winner, should be ranked higher than 29 which
                    // has a better record.
                    teams[5].tid.should.equal(5);
                    teams[7].tid.should.equal(29);
                });
            });
            after(function(done) {
                var i, r1;
                r1 = pseries.series[0];

                for (i = 0; i < r1.length; i++) {
                    if (i === 3) {
                        r1[i].away.won = 4;
                    } else {
                        r1[i].home.won = 4;
                    }
                }
                dao.playoffSeries.put({value: pseries})
                    .then(function() {
                        done();
                    });
            });
        });
        describe("#newSchedulePlayoffsDay", function() {
            var pseries;
            before(function() {
                tx = dao.tx(["teams", "playoffSeries", "players", "playerStats", "events", "schedule"], "readwrite");
                return season.newSchedulePlayoffsDay(tx)
                    .then(function() {
                        return dao.playoffSeries.get({
                            ot: tx,
                            key: g.season
                        });
                    })
                    .then(function(series) {
                        pseries = series;
                    });
            });

            it("should create matchups for next round with proper HCA", function() {
                var r2 = pseries.series[1];
                r2[1].away.tid.should.equal(4);
                r2[1].away.seed.should.equal(7);
                r2[1].home.tid.should.equal(27);
                r2[1].home.seed.should.equal(3);
            });
        });
    });
});
