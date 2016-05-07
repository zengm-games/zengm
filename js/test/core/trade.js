const assert = require('assert');
const db = require('../../db');
const g = require('../../globals');
const league = require('../../core/league');
const trade = require('../../core/trade');

describe("core/trade", () => {
    var testCreateTrade;

    before(() => {
        return db.connectMeta().then(() => {
            return league.create("Test", 0, undefined, 2013, false);
        });
    });
    after(() => {
        return league.remove(g.lid);
    });
    afterEach(() => {
        // Set to a trade with team 1 and no players;
        return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 1, pids: [], dpids: []}]).then(trade.clear);
    });

    testCreateTrade = function (otherTidTest, userPidsTest, otherPidsTest) {
        return trade.get().then(function (teams) {
            assert.equal(teams[1].tid, otherTidTest);
            assert.equal(JSON.stringify(teams[0].pids), JSON.stringify(userPidsTest));
            assert.equal(JSON.stringify(teams[1].pids), JSON.stringify(otherPidsTest));
        });
    };

    describe("#create()", () => {
        it("should create trade with team ID", () => {
            return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 22, pids: [], dpids: []}]).then(() => {
                return testCreateTrade(22, [], []);
            });
        });
        it("should create trade with player ID", () => {
            return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: null, pids: [81], dpids: []}]).then(() => {
                return testCreateTrade(2, [], [81]);
            });
        });
    });

    describe("#updatePlayers()", () => {
        it("should allow players from both teams to be set", () => {
            return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]).then(() => {
                var otherPidsTest, userPidsTest;

                userPidsTest = [48, 50];
                otherPidsTest = [87, 97];
                return trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}]).then(function (teams) {
                    assert.equal(JSON.stringify(teams[0].pids), JSON.stringify(userPidsTest));
                    assert.equal(JSON.stringify(teams[1].pids), JSON.stringify(otherPidsTest));
                });
            });
        });
        it("should filter out invalid players", () => {
            return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]).then(() => {
                return trade.updatePlayers([{tid: g.userTid, pids: [1, 16, 20, 48, 50, 90], dpids: []}, {tid: 3, pids: [12, 63, 70, 87, 97, 524], dpids: []}]);
            }).then(function (teams) {
                assert.equal(JSON.stringify(teams[0].pids), JSON.stringify([48, 50]));
                assert.equal(JSON.stringify(teams[1].pids), JSON.stringify([87, 97]));
            });
        });
        it("should delete the other team's players, but not the user's players, from the trade when a new team is selected", () => {
            return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 3, pids: [], dpids: []}]).then(() => {
                var otherPidsTest, userPidsTest;

                userPidsTest = [48, 50];
                otherPidsTest = [87, 97];
                return trade.updatePlayers([{tid: g.userTid, pids: userPidsTest, dpids: []}, {tid: 3, pids: otherPidsTest, dpids: []}]).then(function (teams) {
                    assert.equal(JSON.stringify(teams[0].pids), JSON.stringify(userPidsTest));
                    assert.equal(JSON.stringify(teams[1].pids), JSON.stringify(otherPidsTest));
                    return trade.create([{tid: g.userTid, pids: [], dpids: []}, {tid: 4, pids: [], dpids: []}]);
                }).then(() => {
                    return trade.get().then(function (teams) {
                        assert.equal(JSON.stringify(teams[0].pids), JSON.stringify(userPidsTest));
                        assert.equal(JSON.stringify(teams[1].pids), JSON.stringify([]));
                    });
                });
            });
        });
    });
});
