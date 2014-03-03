/**
 * @name test.util.account
 * @namespace Tests for util.account.
 */
define(["db", "globals", "core/league", "util/account"], function (db, g, league, account) {
    "use strict";

    describe("util/account", function () {
        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 7, undefined, undefined, 2013, false, function () {
                    done();
                });
            });
        });
        after(function (done) {
            league.remove(g.lid, done);
        });

        describe("#checkAchievement.fo_fo_fo()", function () {
            it("should award achievement for 16-0 playoff record for user's team", function (done) {
                var ps, tx;

                // tid 7 wins 4-0 every series
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = g.dbl.transaction("playoffSeries", "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.oncomplete = function () {
                    account.checkAchievement.fo_fo_fo(function (awarded) {
                        awarded.should.be.true;
                        done();
                    });
                }
            });
            it("should not award achievement for 16-? playoff record for user's team", function (done) {
                var ps, tx;

                // tid 7 loses a game!
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":1,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = g.dbl.transaction("playoffSeries", "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.oncomplete = function () {
                    account.checkAchievement.fo_fo_fo(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                }
            });
            it("should not award achievement for 16-0 playoff record for other team", function (done) {
                var ps, tx;

                // tid 7 is changed to 8
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":1,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = g.dbl.transaction("playoffSeries", "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.oncomplete = function () {
                    account.checkAchievement.fo_fo_fo(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                }
            });
        });
    });
});