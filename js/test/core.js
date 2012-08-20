define(["db", "core/draft", "core/league", "core/player", "core/season", "core/trade", "util/helpers"], function (db, draft, league, player, season, trade, helpers) {
    "use strict";

    function numInArrayEqualTo(array, x) {
        var idx, n;

        n = 0;
        idx = array.indexOf(x);
        while (idx !== -1) {
            n += 1;
            idx = array.indexOf(x, idx + 1);
        }
        return n;
    }

    describe("core/draft", function () {
        var testDraftUntilUserOrEnd, testDraftUser;

        before(function (done) {
            db.connectMeta(function () {
                league.create(4, "random", function () {
                    done();
                });
            });
        });
        after(function (done) {
            league.remove(g.lid, done);
        });

        testDraftUntilUserOrEnd = function (numNow, numTotal, cb) {
            draft.untilUserOrEnd(function (pids) {
                pids.length.should.equal(numNow);
                g.dbl.transaction("players").objectStore("players").index("tid").getAll(c.PLAYER_UNDRAFTED).onsuccess = function (event) {
                    event.target.result.length.should.equal(70 - numTotal);
                    cb();
                };
            });
        };

        testDraftUser = function (round, cb) {
            var draftOrder, pick, playerStore;

            draftOrder = JSON.parse(localStorage.getItem("league" + g.lid + "DraftOrder"));
            pick = draftOrder.shift();
            pick.round.should.equal(round);
            pick.pick.should.equal(5);
            pick.tid.should.equal(g.userTid);
            playerStore = g.dbl.transaction("players", "readwrite").objectStore("players");
            playerStore.index("tid").get(c.PLAYER_UNDRAFTED).onsuccess = function (event) {
                var pidBefore;

                pidBefore = event.target.result.pid;
                draft.selectPlayer(pick, pidBefore, playerStore, function (pidAfter) {
                    pidAfter.should.equal(pidBefore);
                    playerStore.get(pidBefore).onsuccess = function (event) {
                        event.target.result.tid.should.equal(g.userTid);
                        cb();
                    };
                });
                localStorage.setItem("league" + g.lid + "DraftOrder", JSON.stringify(draftOrder));
            };
        };

        describe("#generatePlayers()", function () {
            it("should generate 70 players for the draft", function (done) {
                draft.generatePlayers(function () {
                    g.dbl.transaction("players").objectStore("players").index("draftYear").count(g.season).onsuccess = function (event) {
                        event.target.result.should.equal(70);
                        done();
                    };
                });
            });
        });

        describe("#setOrder()", function () {
            it("should schedule 60 draft picks", function (done) {
                draft.setOrder(function () {
                    JSON.parse(localStorage.getItem("league" + g.lid + "DraftOrder")).length.should.equal(60);
                    done();
                });
            });
        });

        describe("#selectPlayer() and #untilUserOrEnd()", function () {
            it("should draft 4 players before the user's team comes up in the 5th spot", function (done) {
                testDraftUntilUserOrEnd(4, 4, done);
            });
            it("should then allow the user to draft in the first round", function (done) {
                testDraftUser(1, done);
            });
            it("when called again after the user drafts, should draft 29 players before the user's second round pick comes up", function (done) {
                testDraftUntilUserOrEnd(29, 29 + 1 + 4, done);
            });
            it("should then allow the user to draft in the second round", function (done) {
                testDraftUser(2, done);
            });
            it("when called again after the user drafts, should draft 25 more players to finish the draft", function (done) {
                testDraftUntilUserOrEnd(25, 29 + 1 + 4 + 1 + 25, done);
            });
        });
    });

    describe("core/player", function () {
        describe("#generate()", function () {
            it("should add stats row only for players generated on teams, not free agents or undrafted players", function () {
                var p;

                p = player.generate(-2, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(0);

                p = player.generate(-1, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(0);

                p = player.generate(0, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(1);

                p = player.generate(15, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(1);
            });
        });
    });

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
                        numInArrayEqualTo(home[i], 0).should.equal(15);
                        numInArrayEqualTo(home[i], 1).should.equal(15);
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
                        numInArrayEqualTo(home[i], 0).should.equal(26);
                        numInArrayEqualTo(home[i], 2).should.equal(4);
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
                        numInArrayEqualTo(home[i], 0).should.equal(20);
                        numInArrayEqualTo(home[i], 1).should.equal(2);
                        numInArrayEqualTo(home[i], 2).should.equal(8);
                    }

                    teams = helpers.getTeams();
                    done();
                });
            });
        });
    });

    describe("core/trade", function () {
        var testCreateTrade;

        before(function (done) {
            db.connectMeta(function () {
                league.create(0, "random", function () {
                    done();
                });
            });
        });
        after(function (done) {
            league.remove(g.lid, done);
        });
        afterEach(function (done) {
            // Set to a trade with team 1 and no players;
            trade.create(1, null, function () {
                trade.clear(done);
            });
        });

        testCreateTrade = function (otherTidTest, userPidsTest, otherPidsTest, cb) {
            trade.getOtherTid(function (otherTid) {
                otherTid.should.equal(otherTidTest);
                trade.getPlayers(function (userPids, otherPids) {
                    JSON.stringify(userPids).should.equal(JSON.stringify(userPidsTest));
                    JSON.stringify(otherPids).should.equal(JSON.stringify(otherPidsTest));
                    cb();
                });
            });
        };

        describe("#create()", function () {
            it("should create trade with team ID", function (done) {
                trade.create(22, null, function () {
                    testCreateTrade(22, [], [], done);
                });
            });
            it("should create trade with player ID", function (done) {
                trade.create(null, 52, function () {
                    testCreateTrade(2, [], [52], done);
                });
            });
            it("should create trade with player ID overriding team ID", function (done) {
                trade.create(6, 53, function () {
                    testCreateTrade(2, [], [53], done);
                });
            });
        });

        describe("#updatePlayers()", function () {
            it("should allow players from both teams to be set", function (done) {
                trade.create(3, null, function () {
                    var userPidsTest, otherPidsTest;

                    userPidsTest = [16, 20];
                    otherPidsTest = [63, 70];
                    trade.updatePlayers(userPidsTest, otherPidsTest, function (userPids, otherPids) {
                        JSON.stringify(userPids).should.equal(JSON.stringify(userPidsTest));
                        JSON.stringify(otherPids).should.equal(JSON.stringify(otherPidsTest));
                        done();
                    });
                });
            });
            it("should filter out invalid players", function (done) {
                trade.create(3, null, function () {
                    trade.updatePlayers([1, 16, 20, 90], [12, 63, 70, 524], function (userPids, otherPids) {
                        JSON.stringify(userPids).should.equal(JSON.stringify([16, 20]));
                        JSON.stringify(otherPids).should.equal(JSON.stringify([63, 70]));
                        done();
                    });
                });
            });
            it("should delete the other team's players, but not the user's players, from the trade when a new team is selected", function (done) {
                trade.create(3, null, function () {
                    var userPidsTest, otherPidsTest;

                    userPidsTest = [16, 20];
                    otherPidsTest = [63, 70];
                    trade.updatePlayers(userPidsTest, otherPidsTest, function (userPids, otherPids) {
                        JSON.stringify(userPids).should.equal(JSON.stringify(userPidsTest));
                        JSON.stringify(otherPids).should.equal(JSON.stringify(otherPidsTest));
                        trade.create(4, null, function () {
                            trade.getPlayers(function (userPids, otherPids) {
                                JSON.stringify(userPids).should.equal(JSON.stringify(userPidsTest));
                                JSON.stringify(otherPids).should.equal(JSON.stringify([]));
                                done();
                            });
                        });
                    });
                });
            });
        });

        describe("#summary()", function () {
            it("should warn when more than 15 players will be on a team after a trade", function (done) {
                trade.create(5, null, function () {
                    trade.updatePlayers([], [90, 92], function (userPids, otherPids) {
                        trade.summary(5, [], [90, 92], function (summary) {
                            summary.warning.should.contain("over the maximum roster size limit of 15 players");
                            console.log(summary);
                            done();
                        });
                    });
                });
            });
        });
    });
});