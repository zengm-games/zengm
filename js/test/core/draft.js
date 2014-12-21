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

        testDraftUntilUserOrEnd = function (numNow, numTotal, cb) {
            draft.untilUserOrEnd(function (pids) {
                pids.length.should.equal(numNow);
                g.dbl.transaction("players").objectStore("players").index("tid").getAll(g.PLAYER.UNDRAFTED).onsuccess = function (event) {
                    event.target.result.length.should.equal(140 - numTotal);
                    cb();
                };
            });
        };

        testDraftUser = function (round, cb) {
            draft.getOrder(function (draftOrder) {
                var pick;

                pick = draftOrder.shift();
                pick.round.should.equal(round);
                pick.pick.should.equal(21);
                pick.tid.should.equal(g.userTid);

                g.dbl.transaction("players").objectStore("players").index("tid").get(g.PLAYER.UNDRAFTED).onsuccess = function (event) {
                    var pidBefore;

                    pidBefore = event.target.result.pid;
                    draft.selectPlayer(pick, pidBefore, function (pidAfter) {
                        pidAfter.should.equal(pidBefore);
                        g.dbl.transaction("players").objectStore("players").get(pidBefore).onsuccess = function (event) {
                            event.target.result.tid.should.equal(g.userTid);
                            draft.setOrder(draftOrder, cb);
                        };
                    });
                };
            });
        };

        describe("#genPlayers()", function () {
            it("should generate 70 players for the draft", function () {
                return draft.genPlayers(null, g.PLAYER.UNDRAFTED, null, null, function () {
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

/*        describe("#selectPlayer() and #untilUserOrEnd()", function () {
            it("should draft 20 players before the user's team comes up in the 21th spot", function (done) {
                testDraftUntilUserOrEnd(20, 20, done);
            });
            it("should then allow the user to draft in the first round", function (done) {
                testDraftUser(1, done);
            });
            it("when called again after the user drafts, should draft 29 players before the user's second round pick comes up", function (done) {
                testDraftUntilUserOrEnd(29, 29 + 1 + 20, done);
            });
            it("should then allow the user to draft in the second round", function (done) {
                testDraftUser(2, done);
            });
            it("when called again after the user drafts, should draft 9 more players to finish the draft", function (done) {
                testDraftUntilUserOrEnd(9, 29 + 1 + 20 + 1 + 9, done);
            });
        });*/
    });
});