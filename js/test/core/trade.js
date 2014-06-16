/**
 * @name test.core.trade
 * @namespace Tests for core.trade.
 */
define(["db", "globals", "core/league", "core/trade"], function (db, g, league, trade) {
    "use strict";

    describe("core/trade", function () {
        var testCreateTrade;

        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 0, undefined, 2013, false, function () {
                    done();
                });
            });
        });
        after(function (done) {
            league.remove(g.lid, done);
        });
        afterEach(function (done) {
            // Set to a trade with team 1 and no players;
            trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 1, pids: [], dpids: []}], function () {
                trade.clear(done);
            });
        });

        testCreateTrade = function (otherTidTest, userPidsTest, otherPidsTest, cb) {
            trade.get(function (teams) {
                teams[1].tid.should.equal(otherTidTest);
                JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                JSON.stringify(teams[1].pids).should.equal(JSON.stringify(otherPidsTest));
                cb();
            });
        };

        describe("#create()", function () {
            it("should create trade with team ID", function (done) {
                trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 22, pids: [], dpids: []}], function () {
                    testCreateTrade(22, [], [], done);
                });
            });
            it("should create trade with player ID", function (done) {
                trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: null, pids: [81], dpids: []}], function () {
                    testCreateTrade(2, [], [81], done);
                });
            });
        });

        describe("#updatePlayers()", function () {
            it("should allow players from both teams to be set", function (done) {
                trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}], function () {
                    var userPidsTest, otherPidsTest;

                    userPidsTest = [48, 50];
                    otherPidsTest = [87, 97];
                    trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}], function (teams) {
                        JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                        JSON.stringify(teams[1].pids).should.equal(JSON.stringify(otherPidsTest));
                        done();
                    });
                });
            });
            it("should filter out invalid players", function (done) {
                trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}], function () {
                    trade.updatePlayers([{tid: g.userTid, pids: [1, 16, 20, 48, 50, 90], dpids: []}, {tid: 3, pids: [12, 63, 70, 87, 97, 524], dpids: []}], function (teams) {
                        JSON.stringify(teams[0].pids).should.equal(JSON.stringify([48, 50]));
                        JSON.stringify(teams[1].pids).should.equal(JSON.stringify([87, 97]));
                        done();
                    });
                });
            });
            it("should delete the other team's players, but not the user's players, from the trade when a new team is selected", function (done) {
                trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}], function () {
                    var userPidsTest, otherPidsTest;

                    userPidsTest = [48, 50];
                    otherPidsTest = [87, 97];
                    trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}], function (teams) {
                        JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                        JSON.stringify(teams[1].pids).should.equal(JSON.stringify(otherPidsTest));
                        trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 4, pids: [], dpids: []}], function () {
                            trade.get(function (teams) {
                                JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                                JSON.stringify(teams[1].pids).should.equal(JSON.stringify([]));
                                done();
                            })
                        });
                    });
                });
            });
        });
    });
});