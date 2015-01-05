/**
 * @name test.core.trade
 * @namespace Tests for core.trade.
 */
define(["db", "globals", "core/league", "core/trade"], function (db, g, league, trade) {
    "use strict";

    describe("core/trade", function () {
        var testCreateTrade;

        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 0, undefined, 2013, false);
            });
        });
        after(function () {
            return league.remove(g.lid);
        });
        afterEach(function () {
            // Set to a trade with team 1 and no players;
            return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 1, pids: [], dpids: []}]).then(trade.clear);
        });

        testCreateTrade = function (otherTidTest, userPidsTest, otherPidsTest) {
            return trade.get().then(function (teams) {
                teams[1].tid.should.equal(otherTidTest);
                JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                JSON.stringify(teams[1].pids).should.equal(JSON.stringify(otherPidsTest));
            });
        };

        describe("#create()", function () {
            it("should create trade with team ID", function () {
                return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 22, pids: [], dpids: []}]).then(function () {
                    return testCreateTrade(22, [], []);
                });
            });
            it("should create trade with player ID", function () {
                return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: null, pids: [81], dpids: []}]).then(function () {
                    return testCreateTrade(2, [], [81]);
                });
            });
        });

        describe("#updatePlayers()", function () {
            it("should allow players from both teams to be set", function () {
                return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]).then(function () {
                    var otherPidsTest, userPidsTest;

                    userPidsTest = [48, 50];
                    otherPidsTest = [87, 97];
                    return trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}]).then(function (teams) {
                        JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                        JSON.stringify(teams[1].pids).should.equal(JSON.stringify(otherPidsTest));
                    });
                });
            });
            it("should filter out invalid players", function () {
                return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]).then(function () {
                    return trade.updatePlayers([{tid: g.userTid, pids: [1, 16, 20, 48, 50, 90], dpids: []}, {tid: 3, pids: [12, 63, 70, 87, 97, 524], dpids: []}]);
                }).then(function (teams) {
                    JSON.stringify(teams[0].pids).should.equal(JSON.stringify([48, 50]));
                    JSON.stringify(teams[1].pids).should.equal(JSON.stringify([87, 97]));
                });
            });
            it("should delete the other team's players, but not the user's players, from the trade when a new team is selected", function () {
                return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]).then(function () {
                    var otherPidsTest, userPidsTest;

                    userPidsTest = [48, 50];
                    otherPidsTest = [87, 97];
                    return trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}]).then(function (teams) {
                        JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                        JSON.stringify(teams[1].pids).should.equal(JSON.stringify(otherPidsTest));
                        return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 4, pids: [], dpids: []}]);
                    }).then(function () {
                        trade.get(function (teams) {
                            JSON.stringify(teams[0].pids).should.equal(JSON.stringify(userPidsTest));
                            JSON.stringify(teams[1].pids).should.equal(JSON.stringify([]));
                        });
                    });
                });
            });
        });
    });
});