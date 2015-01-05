/**
 * @name test.util.account
 * @namespace Tests for util.account.
 */
/*eslint comma-spacing: 0, key-spacing: 0, no-unused-expressions: 0*/
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
                dao.playoffSeries.put({ot: tx, value: ps});
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
                dao.playoffSeries.put({ot: tx, value: ps});
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
                dao.playoffSeries.put({ot: tx, value: ps});
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

        describe("#checkAchievement.98_degrees()", function () {
            it("should award achievement for 82-0 regular season record and 16-0 playoff record for user's team", function () {
                var ps, tx;

                // tid 7 wins 4-0 every series
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx(["playoffSeries", "teams"], "readwrite");
                dao.playoffSeries.put({ot: tx, value: ps});
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 0;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should not award achievement without 82-0 regular season", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 1;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                        var tx;

                        awarded.should.be.false;

                        tx = dao.tx("teams", "readwrite");
                        dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                            t.seasons[0].won = 81;
                            t.seasons[0].lost = 0;

                            dao.teams.put({ot: tx, value: t});
                        });
                        return tx.complete();
                    });
                }).then(function () {
                    return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not be awarded without 16-0 playoffs", function () {
                var ps, tx;

                // tid 7 lost a game
                ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":1,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

                tx = dao.tx(["playoffSeries", "teams"], "readwrite");
                dao.playoffSeries.put({ot: tx, value: ps});
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].won = 82;
                    t.seasons[0].lost = 0;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
        });

        describe("#checkAchievement.dynasty*()", function () {
            it("should gracefully handle case where not enough seasons are present", function () {
                return account.checkAchievement.dynasty(false).then(function (awarded) {
                    awarded.should.be.false;

                    return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should award dynasty for 6 titles in 8 seasons, but not dynasty_2 or dynasty_3", function () {
                var tx;

                // Add 6 to the existing season, making 7 seasons total
                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    var extraSeasons;

                    extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];
                    t.seasons = t.seasons.concat(extraSeasons);

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.dynasty(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    var tx;

                    // Add 1 to the existing 7 seasons, making 8 seasons total
                    tx = dao.tx("teams", "readwrite");
                    dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                        var extraSeasons;

                        extraSeasons = [{playoffRoundsWon: 3}];
                        t.seasons = t.seasons.concat(extraSeasons);

                        dao.teams.put({ot: tx, value: t});
                    });
                    return tx.complete();
                }).then(function () {
                    return account.checkAchievement.dynasty(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should award dynasty and dynasty_2 for 8 titles in 8 seasons, but not dynasty_3", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    // Update non-winning years from last test
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[7].playoffRoundsWon = 4;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.dynasty(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should award dynasty, dynasty_2, and dynasty_3 for 11 titles in 13 seasons if there are 8 contiguous", function () {
                var tx;

                // Add 5 to the existing season, making 13 seasons total
                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    var extraSeasons;

                    t.seasons[0].playoffRoundsWon = 0;
                    t.seasons[1].playoffRoundsWon = 0;
                    extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];
                    t.seasons = t.seasons.concat(extraSeasons);

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.dynasty(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should award dynasty and dynasty_3 for 11 titles in 13 seasons, but not dynasty_2 if there are not 8 contiguous", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    // Swap a couple titles to make no 8 in a row
                    t.seasons[9].playoffRoundsWon = 0;
                    t.seasons[0].playoffRoundsWon = 4;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.dynasty(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
        });

        describe("#checkAchievement.moneyball*()", function () {
            it("should award moneyball and moneyball_2 for title with payroll <= $30M", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons = [t.seasons[0]]; // Reset from dynasty*, only one season
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].expenses.salary.amount = 30000;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.moneyball(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should not award either if didn't win title", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].playoffRoundsWon = 3;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.moneyball(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should award moneyball but not moneyball_2 for title with payroll > $30M and <= $40M", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].expenses.salary.amount = 40000;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.moneyball(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                }).then(function () {
                    return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award either if payroll > $40M", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].expenses.salary.amount = 40001;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.moneyball(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                }).then(function () {
                    return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
        });

        describe("#checkAchievement.hardware_store()", function () {
            it("should award achievement if user's team sweeps awards", function () {
                var awards, tx;

                // tid 7 wins all awards
                awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":7,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":7,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}};

                tx = dao.tx("awards", "readwrite");
                dao.awards.put({ot: tx, value: awards});
                return tx.complete().then(function () {
                    return account.checkAchievement.hardware_store(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should not award achievement if user's team loses an award", function () {
                var awards, tx;

                // tid 7 wins loses an award!
                awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":8,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":7,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}};

                tx = dao.tx("awards", "readwrite");
                dao.awards.put({ot: tx, value: awards});
                return tx.complete().then(function () {
                    return account.checkAchievement.hardware_store(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement if another team sweeps the awards", function () {
                var awards, tx;

                // tid 7 is changed to 8
                awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":8,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":8,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":8,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":8,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":8,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}};

                tx = dao.tx("awards", "readwrite");
                dao.awards.put({ot: tx, value: awards});
                return tx.complete().then(function () {
                    return account.checkAchievement.hardware_store(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
        });

        describe("#checkAchievement.small_market()", function () {
            it("should award achievement if user's team wins title in a small market", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].pop = 1.5;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.small_market(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should not award achievement if user's team is not in a small market", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].playoffRoundsWon = 4;
                    t.seasons[0].pop = 3;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.small_market(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement if user's team does not win the title", function () {
                var tx;

                tx = dao.tx("teams", "readwrite");
                dao.teams.get({ot: tx, key: g.userTid}).then(function (t) {
                    t.seasons[0].playoffRoundsWon = 3;
                    t.seasons[0].pop = 1.5;

                    dao.teams.put({ot: tx, value: t});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.small_market(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
        });

        describe("#checkAchievement.sleeper_pick()", function () {
            it("should award achievement if user's non-lottery pick wins ROY while on user's team", function () {
                return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                    var awards, tx;

                    awarded.should.be.false;

                    tx = dao.tx(["awards", "players"], "readwrite");

                    dao.players.get({ot: tx, key: 1}).then(function (p) {
                        p.tid = g.userTid;
                        p.draft.tid = g.userTid;
                        p.draft.round = 1;
                        p.draft.pick = 20;
                        p.draft.year = g.season - 1;

                        dao.players.put({ot: tx, value: p});
                    });

                    // ROY is pid 1 on tid 7
                    awards = {"season":2013,"roy":{"pid":1,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973}};

                    dao.awards.put({ot: tx, value: awards});

                    return tx.complete();
                }).then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        awarded.should.be.true;
                    });
                });
            });
            it("should not award achievement if not currently on user's team", function () {
                var tx;

                tx = dao.tx("players", "readwrite");
                dao.players.get({ot: tx, key: 1}).then(function (p) {
                    p.tid = 15;

                    dao.players.put({ot: tx, value: p});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement if not drafted by user", function () {
                var tx;

                tx = dao.tx("players", "readwrite");
                dao.players.get({ot: tx, key: 1}).then(function (p) {
                    p.tid = g.userTid;
                    p.draft.tid = 15;

                    dao.players.put({ot: tx, value: p});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement if lottery pick", function () {
                var tx;

                tx = dao.tx("players", "readwrite");
                dao.players.get({ot: tx, key: 1}).then(function (p) {
                    p.draft.tid = g.userTid;
                    p.draft.pick = 7;

                    dao.players.put({ot: tx, value: p});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement if old pick", function () {
                var tx;

                tx = dao.tx("players", "readwrite");
                dao.players.get({ot: tx, key: 1}).then(function (p) {
                    p.draft.pick = 15;
                    p.draft.year = g.season - 2;

                    dao.players.put({ot: tx, value: p});
                });
                return tx.complete().then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
            it("should not award achievement not ROY", function () {
                var awards, tx;

                tx = dao.tx(["awards", "players"], "readwrite");

                // Switch to pid 2
                awards = {"season":2013,"roy":{"pid":2,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973}};
                dao.awards.put({ot: tx, value: awards});

                dao.players.get({ot: tx, key: 1}).then(function (p) {
                    p.draft.year = g.season - 1;

                    dao.players.put({ot: tx, value: p});
                });

                return tx.complete().then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        awarded.should.be.false;
                    });
                });
            });
        });
    });
});