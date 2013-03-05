/**
 * @name test.core.draft
 * @namespace Tests for core.draft.
 */
define(["db", "globals", "core/draft", "core/league"], function (db, g, draft, league) {
    "use strict";

    describe("core/draft", function () {
        var testDraftUntilUserOrEnd, testDraftUser;

        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 4, "random", function () {
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
                g.dbl.transaction("players").objectStore("players").index("tid").getAll(g.PLAYER.UNDRAFTED).onsuccess = function (event) {
                    event.target.result.length.should.equal(70 - numTotal);
                    cb();
                };
            });
        };

        testDraftUser = function (round, cb) {
            db.getDraftOrder(function (draftOrder) {
                var pick;

                pick = draftOrder.shift();
                pick.round.should.equal(round);
                pick.pick.should.equal(5);
                pick.tid.should.equal(g.userTid);

                g.dbl.transaction("players").objectStore("players").index("tid").get(g.PLAYER.UNDRAFTED).onsuccess = function (event) {
                    var pidBefore;

                    pidBefore = event.target.result.pid;
                    draft.selectPlayer(pick, pidBefore, function (pidAfter) {
                        pidAfter.should.equal(pidBefore);
                        g.dbl.transaction("players").objectStore("players").get(pidBefore).onsuccess = function (event) {
                            event.target.result.tid.should.equal(g.userTid);
                            db.setDraftOrder(draftOrder, cb);
                        };
                    });
                };
            });
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
                    db.getDraftOrder(function (draftOrder) {
                        draftOrder.length.should.equal(60);
                        done();
                    });
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
});