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
                };
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
                };
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
                };
            });
        });

        describe("#checkAchievement.septuawinarian()", function () {
            it("should award achievement only if user's team has more than 70 wins", function (done) {
                account.checkAchievement.septuawinarian(function (awarded) {
                    var tx;

                    awarded.should.be.false;

                    tx = g.dbl.transaction("teams", "readwrite");
                    tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                        var cursor, t;

                        cursor = event.target.result;
                        t = cursor.value;

                        t.seasons[0].won = 70;

                        cursor.update(t);
                    };
                    tx.oncomplete = function () {
                        account.checkAchievement.septuawinarian(function (awarded) {
                            awarded.should.be.true;
                            done();
                        });
                    };
                });
            });
        });

        describe("#checkAchievement.98_degrees()", function () {
            it("should award achievement for 82-0 regular season record and 16-0 playoff record for user's team", function (done) {
                var ps, tx;

                // tid 7 wins 4-0 every series
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = g.dbl.transaction(["playoffSeries", "teams"], "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 0;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement["98_degrees"](function (awarded) {
                        awarded.should.be.true;
                        done();
                    });
                };
            });
            it("should not award achievement without 82-0 regular season", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 1;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement["98_degrees"](function (awarded) {
                        var tx;

                        awarded.should.be.false;

                        tx = g.dbl.transaction("teams", "readwrite");
                        tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                            var cursor, t;

                            cursor = event.target.result;
                            t = cursor.value;

                            t.seasons[0].won = 81;
                            t.seasons[0].lost = 0;

                            cursor.update(t);
                        };

                        tx.oncomplete = function () {
                            account.checkAchievement["98_degrees"](function (awarded) {
                                awarded.should.be.false;
                                done();
                            });
                        };
                    });
                };
            });
            it("should not be awarded without 16-0 playoffs", function (done) {
                var ps, tx;

                // tid 7 lost a game
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":1,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = g.dbl.transaction(["playoffSeries", "teams"], "readwrite");
                tx.objectStore("playoffSeries").put(ps);
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 0;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement["98_degrees"](function (awarded) {
                        awarded.should.be.false;
                        done();
                    });
                };
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
                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, extraSeasons, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];
                    t.seasons = t.seasons.concat(extraSeasons);

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement.dynasty(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.dynasty_2(function (awarded) {
                            awarded.should.be.false;

                            account.checkAchievement.dynasty_3(function (awarded) {
                                var tx;

                                awarded.should.be.false;

                                // Add 1 to the existing 7 seasons, making 8 seasons total
                                tx = g.dbl.transaction("teams", "readwrite");
                                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                                    var cursor, extraSeasons, t;

                                    cursor = event.target.result;
                                    t = cursor.value;

                                    extraSeasons = [{playoffRoundsWon: 3}];
                                    t.seasons = t.seasons.concat(extraSeasons);

                                    cursor.update(t);
                                };
                                tx.oncomplete = function () {
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
                                };
                            });
                        });
                    });
                };
            });
            it("should award dynasty and dynasty_2 for 8 titles in 8 seasons, but not dynasty_3", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    // Update non-winning years from last test
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[7].playoffRoundsWon = 4;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
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
                };
            });
            it("should award dynasty, dynasty_2, and dynasty_3 for 11 titles in 13 seasons if there are 8 contiguous", function (done) {
                var tx;

                // Add 5 to the existing season, making 13 seasons total
                tx = g.dbl.transaction("teams", "readwrite");
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
                tx.oncomplete = function () {
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
                };
            });
            it("should award dynasty and dynasty_3 for 11 titles in 13 seasons, but not dynasty_2 if there are not 8 contiguous", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    // Swap a couple titles to make no 8 in a row
                    t.seasons[9].playoffRoundsWon = 0;
                    t.seasons[0].playoffRoundsWon = 4;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
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
                };
            });
        });

        describe("#checkAchievement.moneyball*()", function () {
            it("should award moneyball and moneyball_2 for title with payroll <= $30M", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons = [t.seasons[0]]; // Reset from dynasty*, only one season
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].expenses.salary.amount = 30000;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.true;

                            done();
                        });
                    });
                };
            });
            it("should not award either if didn't win title", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 3;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.false;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                };
            });
            it("should award moneyball but not moneyball_2 for title with payroll > $30M and <= $40M", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].expenses.salary.amount = 40000;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.true;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                };
            });
            it("should not award either if payroll > $40M", function (done) {
                var tx;

                tx = g.dbl.transaction("teams", "readwrite");
                tx.objectStore("teams").openCursor(g.userTid).onsuccess = function (event) {
                    var cursor, t;

                    cursor = event.target.result;
                    t = cursor.value;

                    t.seasons[0].expenses.salary.amount = 40001;

                    cursor.update(t);
                };
                tx.oncomplete = function () {
                    account.checkAchievement.moneyball(function (awarded) {
                        awarded.should.be.false;

                        account.checkAchievement.moneyball_2(function (awarded) {
                            awarded.should.be.false;

                            done();
                        });
                    });
                };
            });
        });
    });
});