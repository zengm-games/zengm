/**
 * @name test.util.account
 * @namespace Tests for util.account.
 */
define(["dao", "db", "globals", "core/league", "util/account"], function (dao, db, g, league, account) {
    "use strict";

    describe("util/account", function () {
        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 7, undefined, 2013, false);
            });
        });
        after(function () {
            return league.remove(g.lid);
        });

        describe("#checkAchievement.fo_fo_fo()", function () {
            it("should award achievement for 16-0 playoff record for user's team", function () {
                var ps, tx;

                // tid 7 wins 4-0 every series
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx("playoffSeries", "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                return tx.complete().then(function () {
                    return account.checkAchievement.fo_fo_fo(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should not award achievement for 16-? playoff record for user's team", function () {
                var ps, tx;

                // tid 7 loses a game!
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":1,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx("playoffSeries", "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                return tx.complete().then(function () {
                    return account.checkAchievement.fo_fo_fo(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement for 16-0 playoff record for other team", function () {
                var ps, tx;

                // tid 7 is changed to 8
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":1,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx("playoffSeries", "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                return tx.complete().then(function () {
                    return account.checkAchievement.fo_fo_fo(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
        });

        describe("#checkAchievement.septuawinarian()", function () {
            it("should award achievement only if user's team has more than 70 wins", function () {
                return account.checkAchievement.septuawinarian(false).then(function (awarded) {
                    var tx;

                    awarded.should.be.false;

                    tx = dao.tx("teams", "readwrite");
                    dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                        t.seasons[0].won = 70;

                        dao.teams.put({ot: tx, value: t});
                    });
                    return tx.complete();
                }).then(function () {
                    return account.checkAchievement.septuawinarian(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
        });

/*        describe("#checkAchievement.98_degrees()", function () {
            it("should award achievement for 82-0 regular season record and 16-0 playoff record for user's team", function (done) {
                var ps, tx;

                // tid 7 wins 4-0 every series
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx(["playoffSeries", "teams"], "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 0;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement["98_degrees"](function (awarded) {
                        awarded.should.be.true;
                        done();
                    });
                });
            });
            it("should not award achievement without 82-0 regular season", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 1;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement["98_degrees"](function (awarded) {
                        var tx;

                        awarded.should.be.false;

                        tx = dao.tx("teams", "readwrite");
                        tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                            var cursor, t;

                            cursor = event.target.result;
                            t = cursor.value;

                            t.seasons[0].won = 81;
                            t.seasons[0].lost = 0;

                            cursor.update(t);
                        };

                        tx.complete().then(function () {
                            account.checkAchievement["98_degrees"](function (awarded) {
                                awarded.should.be.false;
                                done();
                            });
                        });
                    });
                });
            });
            it("should not be awarded without 16-0 playoffs", function (done) {
                var ps, tx;

                // tid 7 lost a game
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":1,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx(["playoffSeries", "teams"], "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 0;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement["98_degrees"](function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
        });

        describe("#checkAchievement.dynasty*()", function () {
            it("should gracefully handle case where not enough seasons are present", function (done) {
                account.checkAchievement.dynasty(function (awarded) {
                    awarded.should.be.false;

                    account.checkAchievement.dynasty_2(function (awarded) {
                        awarded.should.be.false;

                        account.checkAchievement.dynasty_3(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                });
            });
            it("should award dynasty for 6 titles in 8 seasons, but not dynasty_2 or dynasty_3", function (done) {
                var tx;

                // Add 6 to the existing season, making 7 seasons total
                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, extraSeasons, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];
                    t.seasons = t.seasons.concat(extraSeasons);

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.dynasty(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.dynasty_2(function (awarded) {
                            awarded.should.be.false;

                            account.checkAchievement.dynasty_3(function (awarded) {
                                var tx;

                                awarded.should.be.false;

                                // Add 1 to the existing 7 seasons, making 8 seasons total
                                tx = dao.tx("teams", "readwrite");
                                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                                    var cursor, extraSeasons, t;

                                    cursor = event.target.result;
                                    t = cursor.value;

                                    extraSeasons = [{playoffRoundsWon: 3}];
                                    t.seasons = t.seasons.concat(extraSeasons);

                                    cursor.update(t);
                                };
                                tx.complete().then(function () {
                                    account.checkAchievement.dynasty(function (awarded) {
                                        awarded.should.be.true;

                                        account.checkAchievement.dynasty_2(function (awarded) {
                                            awarded.should.be.false;

                                            account.checkAchievement.dynasty_3(function (awarded) {
                                                awarded.should.be.false;

                                                done();
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
            it("should award dynasty and dynasty_2 for 8 titles in 8 seasons, but not dynasty_3", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    // Update non-winning years from last test
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[7].playoffRoundsWon = 4;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.dynasty(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.dynasty_2(function (awarded) {
                            awarded.should.be.true;

                            account.checkAchievement.dynasty_3(function (awarded) {
                                awarded.should.be.false;

                                done();
                            });
                        });
                    });
                });
            });
            it("should award dynasty, dynasty_2, and dynasty_3 for 11 titles in 13 seasons if there are 8 contiguous", function (done) {
                var tx;

                // Add 5 to the existing season, making 13 seasons total
                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, extraSeasons, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 0;
                    t.seasons[1].playoffRoundsWon = 0;
                    extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];
                    t.seasons = t.seasons.concat(extraSeasons);

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.dynasty(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.dynasty_2(function (awarded) {
                            //awarded.should.be.true;

                            account.checkAchievement.dynasty_3(function (awarded) {
                                awarded.should.be.true;

                                done();
                            });
                        });
                    });
                });
            });
            it("should award dynasty and dynasty_3 for 11 titles in 13 seasons, but not dynasty_2 if there are not 8 contiguous", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    // Swap a couple titles to make no 8 in a row
                    t.seasons[9].playoffRoundsWon = 0;
                    t.seasons[0].playoffRoundsWon = 4;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.dynasty(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.dynasty_2(function (awarded) {
                            awarded.should.be.false;

                            account.checkAchievement.dynasty_3(function (awarded) {
                                awarded.should.be.true;

                                done();
                            });
                        });
                    });
                });
            });
        });

        describe("#checkAchievement.moneyball*()", function () {
            it("should award moneyball and moneyball_2 for title with payroll <= $30M", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons = [t.seasons[0]]; // Reset from dynasty*, only one season
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].expenses.salary.amount = 30000;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.true;

                            done();
                        });
                    });
                });
            });
            it("should not award either if didn't win title", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 3;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.false;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                });
            });
            it("should award moneyball but not moneyball_2 for title with payroll > $30M and <= $40M", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].expenses.salary.amount = 40000;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                });
            });
            it("should not award either if payroll > $40M", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].expenses.salary.amount = 40001;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.false;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                });
            });
        });

        describe("#checkAchievement.hardware_store()", function () {
            it("should award achievement if user's team sweeps awards", function (done) {
                var awards, tx;

                // tid 7 wins all awards
                awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":7,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":7,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}} ;

                tx = dao.tx("awards", "readwrite");
                tx.objectStore("awards").put(awards);
                tx.complete().then(function () {
                    account.checkAchievement.hardware_store(function (awarded) {
                        awarded.should.be.true;
                        done();
                    });
                });
            });
            it("should not award achievement if user's team loses an award", function (done) {
                var awards, tx;

                // tid 7 wins loses an award!
                awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":8,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":7,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}} ;

                tx = dao.tx("awards", "readwrite");
                tx.objectStore("awards").put(awards);
                tx.complete().then(function () {
                    account.checkAchievement.hardware_store(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
            it("should not award achievement if another team sweeps the awards", function (done) {
                var awards, tx;

                // tid 7 is changed to 8
                awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":8,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":8,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":8,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":8,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":8,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}} ;

                tx = dao.tx("awards", "readwrite");
                tx.objectStore("awards").put(awards);
                tx.complete().then(function () {
                    account.checkAchievement.hardware_store(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
        });

        describe("#checkAchievement.small_market()", function () {
            it("should award achievement if user's team wins title in a small market", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].pop = 1.5;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.small_market(function (awarded) {
                        awarded.should.be.true;
                        done();
                    });
                });
            });
            it("should not award achievement if user's team is not in a small market", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].pop = 3;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.small_market(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
            it("should not award achievement if user's team does not win the title", function (done) {
                var tx;

                tx = dao.tx("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 3;
                    t.seasons[0].pop = 1.5;

                    cursor.update(t);
                };
                tx.complete().then(function () {
                    account.checkAchievement.small_market(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
        });

        describe("#checkAchievement.sleeper_pick()", function () {
            it("should award achievement if user's non-lottery pick wins ROY while on user's team", function (done) {
                account.checkAchievement.sleeper_pick(function (awarded) {
                    var awards, tx;

                    awarded.should.be.false;

                    tx = dao.tx(["awards", "players"], "readwrite");

                    tx.objectStore("players").openCursor(1).onsuccess = function (event) {
                        var cursor, p;

                        cursor = event.target.result;
                        p = cursor.value;

                        p.tid = g.userTid;
                        p.draft.tid = g.userTid;
                        p.draft.round = 1;
                        p.draft.pick = 20;
                        p.draft.year = g.season - 1;

                        cursor.update(p);
                    };

                    // ROY is pid 1 on tid 7
                    awards = {"season":2013,"roy":{"pid":1,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973}} ;

                    tx.objectStore("awards").put(awards);

                    tx.complete().then(function () {
                        account.checkAchievement.sleeper_pick(function (awarded) {
                            awarded.should.be.true;
                            done();
                        });
                    });
                });
            });
            it("should not award achievement if not currently on user's team", function (done) {
                var tx;

                tx = dao.tx("players", "readwrite");
                tx.objectStore("players").openCursor(1).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    p.tid = 15;

                    cursor.update(p);
                };
                tx.complete().then(function () {
                    account.checkAchievement.sleeper_pick(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
            it("should not award achievement if not drafted by user", function (done) {
                var tx;

                tx = dao.tx("players", "readwrite");
                tx.objectStore("players").openCursor(1).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    p.tid = g.userTid;
                    p.draft.tid = 15;

                    cursor.update(p);
                };
                tx.complete().then(function () {
                    account.checkAchievement.sleeper_pick(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
            it("should not award achievement if lottery pick", function (done) {
                var tx;

                tx = dao.tx("players", "readwrite");
                tx.objectStore("players").openCursor(1).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    p.draft.tid = g.userTid;
                    p.draft.pick = 7;

                    cursor.update(p);
                };
                tx.complete().then(function () {
                    account.checkAchievement.sleeper_pick(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
            it("should not award achievement if old pick", function (done) {
                var tx;

                tx = dao.tx("players", "readwrite");
                tx.objectStore("players").openCursor(1).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    p.draft.pick = 15;
                    p.draft.year = g.season - 2;

                    cursor.update(p);
                };
                tx.complete().then(function () {
                    account.checkAchievement.sleeper_pick(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
            it("should not award achievement not ROY", function (done) {
                var awards, tx;

                tx = dao.tx(["awards", "players"], "readwrite");

                // Switch to pid 2
                awards = {"season":2013,"roy":{"pid":2,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973}} ;
                tx.objectStore("awards").put(awards);

                tx.objectStore("players").openCursor(1).onsuccess = function (event) {
                    var cursor, p;

                    cursor = event.target.result;
                    p = cursor.value;

                    p.draft.year = g.season - 1;

                    cursor.update(p);
                };

                tx.complete().then(function () {
                    account.checkAchievement.sleeper_pick(function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                });
            });
        });*/
    });
});