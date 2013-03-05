/**
 * @name test.core.season
 * @namespace Tests for core.season.
 */
define(["db", "globals", "core/season", "util/helpers", "test/helpers"], function (db, g, season, helpers, testHelpers) {
    "use strict";

    describe("core/season", function () {
        describe("#newSchedule()", function () {
            it("should schedule 1230 games (82 each for 30 teams)", function (done) {
                season.newSchedule(function (tids) {
                    tids.length.should.equal(1230);
                    done();
                });
            });
            it("should schedule 41 home games and 41 away games for each team", function (done) {
                season.newSchedule(function (tids) {
                    var away, home, i;

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

                    done();
                });
            });
            it("should schedule each team one home game against every team in the other conference", function (done) {
                season.newSchedule(function (tids) {
                    var home, i, j, teams;

                    home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
                    for (i = 0; i < g.numTeams; i++) {
                        home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    }

                    teams = helpers.getTeams();

                    for (i = 0; i < tids.length; i++) {
                        if (teams[tids[i][0]].cid !== teams[tids[i][1]].cid) {
                            home[tids[i][1]][tids[i][0]] += 1;
                        }
                    }

                    for (i = 0; i < g.numTeams; i++) {
                        testHelpers.numInArrayEqualTo(home[i], 0).should.equal(15);
                        testHelpers.numInArrayEqualTo(home[i], 1).should.equal(15);
                    }

                    done();
                });
            });
            it("should schedule each team two home games against every team in the same division", function (done) {
                season.newSchedule(function (tids) {
                    var home, i, j, teams;

                    home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
                    for (i = 0; i < g.numTeams; i++) {
                        home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    }

                    teams = helpers.getTeams();

                    for (i = 0; i < tids.length; i++) {
                        if (teams[tids[i][0]].did === teams[tids[i][1]].did) {
                            home[tids[i][1]][tids[i][0]] += 1;
                        }
                    }

                    for (i = 0; i < g.numTeams; i++) {
                        testHelpers.numInArrayEqualTo(home[i], 0).should.equal(26);
                        testHelpers.numInArrayEqualTo(home[i], 2).should.equal(4);
                    }

                    teams = helpers.getTeams();
                    done();
                });
            });
            it("should schedule each team one or two home games against every team in the same conference but not in the same division (one game: 2/10 teams; two games: 8/10 teams)", function (done) {
                season.newSchedule(function (tids) {
                    var home, i, j, teams;

                    home = []; // Each element in this array is an array representing the number of home games against each other team (only the ones in the other conference will be populated)
                    for (i = 0; i < g.numTeams; i++) {
                        home.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
                    }

                    teams = helpers.getTeams();

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

                    teams = helpers.getTeams();
                    done();
                });
            });
        });
    });
});