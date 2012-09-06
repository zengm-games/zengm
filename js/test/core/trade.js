/**
 * @name test.core.trade
 * @namespace Tests for core.trade.
 */
define(["db", "core/league", "core/trade"], function (db, league, trade) {
    "use strict";

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
                            summary.disablePropose.should.equal(true);
                            done();
                        });
                    });
                });
            });
        });
    });
});