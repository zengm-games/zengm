/**
 * @name test.core.draft
 * @namespace Tests for core.draft.
 */
define(["dao", "db", "globals", "core/draft", "core/league"], function (dao, db, g, draft, league) {
    "use strict";

    describe("core/draft", function () {
        var testDraftUntilUserOrEnd, testDraftUser;

        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 20, undefined, 2013, false);
            });
        });
        after(function () {
            return league.remove(g.lid);
        });

        testDraftUntilUserOrEnd = function (numNow, numTotal) {
            return draft.untilUserOrEnd().then(function (pids) {
                pids.length.should.equal(numNow);
                return dao.players.getAll({
                    index: "tid",
                    key: g.PLAYER.UNDRAFTED
                }).then(function (players) {
                    players.length.should.equal(140 - numTotal);
                });
            });
        };

        testDraftUser = function (round) {
            return draft.getOrder().then(function (draftOrder) {
                var pick;

                pick = draftOrder.shift();
                pick.round.should.equal(round);
                pick.pick.should.equal(21);
                pick.tid.should.equal(g.userTid);

                return dao.players.get({
                    index: "tid",
                    key: g.PLAYER.UNDRAFTED
                }).then(function (p) {
                    return draft.selectPlayer(pick, p.pid).then(function () {
                        return dao.players.get({
                            key: p.pid
                        }).then(function (p2) {
                            p2.tid.should.equal(g.userTid);
                            return draft.setOrder(draftOrder);
                        });
                    });
                });
            });
        };

        describe("#genPlayers()", function () {
            it("should generate 70 players for the draft", function () {
                var tx;
                tx = dao.tx(["players", "teams"], "readwrite");
                draft.genPlayers(tx, g.PLAYER.UNDRAFTED, null, null);
                return tx.complete().then(function () {
                    return dao.players.count({
                        index: "draft.year",
                        key: g.season
                    }).then(function (numPlayers) {
                        numPlayers.should.equal(140); // 70 from original league, 70 from this
                    });
                });
            });
        });

        describe("#genOrder()", function () {
            it("should schedule 60 draft picks", function () {
                return draft.genOrder().then(function () {
                    return draft.getOrder();
                }).then(function (draftOrder) {
                    draftOrder.length.should.equal(60);
                });
            });
        });

        describe("#selectPlayer() and #untilUserOrEnd()", function () {
            it("should draft 20 players before the user's team comes up in the 21th spot", function () {
                return testDraftUntilUserOrEnd(20, 20);
            });
            it("should then allow the user to draft in the first round", function () {
                return testDraftUser(1);
            });
            it("when called again after the user drafts, should draft 29 players before the user's second round pick comes up", function () {
                return testDraftUntilUserOrEnd(29, 29 + 1 + 20);
            });
            it("should then allow the user to draft in the second round", function () {
                return testDraftUser(2);
            });
            it("when called again after the user drafts, should draft 9 more players to finish the draft", function () {
                return testDraftUntilUserOrEnd(9, 29 + 1 + 20 + 1 + 9);
            });
        });
    });
});