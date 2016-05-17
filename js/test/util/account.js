/*eslint comma-spacing: 0, key-spacing: 0, no-unused-expressions: 0*/
'use strict';

var assert = require('assert');
var backboard = require('backboard');
var Promise = require('bluebird');
var db = require('../../db');
var g = require('../../globals');
var league = require('../../core/league');
var account = require('../../util/account');

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
            // tid 7 wins 4-0 every series
            var ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

            return g.dbl.tx("playoffSeries", "readwrite", function (tx) {
                return tx.playoffSeries.put(ps);
            }).then(function () {
                return account.checkAchievement.fo_fo_fo(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should not award achievement for 16-? playoff record for user's team", function () {
            // tid 7 loses a game!
            var ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":1,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

            return g.dbl.tx("playoffSeries", "readwrite", function (tx) {
                return tx.playoffSeries.put(ps);
            }).then(function () {
                return account.checkAchievement.fo_fo_fo(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award achievement for 16-0 playoff record for other team", function () {
            // tid 7 is changed to 8
            var ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":1,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":8,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

            return g.dbl.tx("playoffSeries", "readwrite", function (tx) {
                return tx.playoffSeries.put(ps);
            }).then(function () {
                return account.checkAchievement.fo_fo_fo(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
    });

    describe("#checkAchievement.septuawinarian()", function () {
        it("should award achievement only if user's team has more than 70 wins", function () {
            return account.checkAchievement.septuawinarian(false).then(function (awarded) {
                assert.equal(awarded, false);

                return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                    return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                        teamSeason.won = 70;

                        return tx.teamSeasons.put(teamSeason);
                    });
                });
            }).then(function () {
                return account.checkAchievement.septuawinarian(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
    });

    describe("#checkAchievement.98_degrees()", function () {
        it("should award achievement for 82-0 regular season record and 16-0 playoff record for user's team", function () {
            var ps;

            // tid 7 wins 4-0 every series
            ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":0,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

            return g.dbl.tx(["playoffSeries", "teamSeasons"], "readwrite", function (tx) {
                return tx.playoffSeries.put(ps).then(function () {
                    return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                        teamSeason.won = 82;
                        teamSeason.lost = 0;

                        return tx.teamSeasons.put(teamSeason);
                    });
                });
            }).then(function () {
                return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should not award achievement without 82-0 regular season", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.won = 82;
                    teamSeason.lost = 1;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                    assert.equal(awarded, false);

                    return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                        return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                            teamSeason.won = 81;
                            teamSeason.lost = 0;

                            return tx.teamSeasons.put(teamSeason);
                        });
                    });
                });
            }).then(function () {
                return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not be awarded without 16-0 playoffs", function () {
            // tid 7 lost a game
            var ps = {"season":2013,"currentRound":3,"series":[[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":16,"cid":0,"winp":0.47560975609756095,"won":1,"seed":8}},{"home":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":4,"seed":4},"away":{"tid":15,"cid":0,"winp":0.5609756097560976,"won":1,"seed":5}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":5,"cid":0,"winp":0.5609756097560976,"won":3,"seed":6}},{"home":{"tid":29,"cid":0,"winp":0.6951219512195121,"won":3,"seed":2},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":4,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":23,"cid":1,"winp":0.5365853658536586,"won":0,"seed":8}},{"home":{"tid":12,"cid":1,"winp":0.6829268292682927,"won":1,"seed":4},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":4,"seed":5}},{"home":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3},"away":{"tid":14,"cid":1,"winp":0.5853658536585366,"won":0,"seed":6}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":4,"seed":2},"away":{"tid":18,"cid":1,"winp":0.5487804878048781,"won":3,"seed":7}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":1,"cid":0,"winp":0.6097560975609756,"won":0,"seed":4}},{"home":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":4,"seed":3},"away":{"tid":17,"cid":0,"winp":0.5121951219512195,"won":1,"seed":7}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":24,"cid":1,"winp":0.5853658536585366,"won":3,"seed":5}},{"home":{"tid":6,"cid":1,"winp":0.7439024390243902,"won":1,"seed":2},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":4,"seed":3}}],[{"home":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1},"away":{"tid":26,"cid":0,"winp":0.6219512195121951,"won":0,"seed":3}},{"home":{"tid":11,"cid":1,"winp":0.8048780487804879,"won":4,"seed":1},"away":{"tid":20,"cid":1,"winp":0.7317073170731707,"won":2,"seed":3}}],[{"home":{"tid":4,"cid":1,"winp":0.8048780487804879,"won":0,"seed":1},"away":{"tid":7,"cid":0,"winp":0.7317073170731707,"won":4,"seed":1}}]]};

            return g.dbl.tx(["playoffSeries", "teamSeasons"], "readwrite", function (tx) {
                return tx.playoffSeries.put(ps).then(function () {
                    return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                        teamSeason.won = 82;
                        teamSeason.lost = 0;

                        return tx.teamSeasons.put(teamSeason);
                    });
                });
            }).then(function () {
                return account.checkAchievement["98_degrees"](false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
    });

    function addExtraSeasons(tid, lastSeason, extraSeasons) {
        return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
            return Promise.each(extraSeasons, function (extraSeason) {
                lastSeason += 1;
                extraSeason.tid = tid;
                extraSeason.season = lastSeason;
                return tx.teamSeasons.add(extraSeason);
            });
        });
    }

    describe("#checkAchievement.dynasty*()", function () {
        after(function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index('tid, season').iterate(backboard.bound([g.userTid], [g.userTid, '']), function (teamSeason) {
                    if (teamSeason.season > g.season) {
                        return tx.teamSeasons.delete(teamSeason.rid);
                    }
                });
            });
        });

        it("should gracefully handle case where not enough seasons are present", function () {
            return account.checkAchievement.dynasty(false).then(function (awarded) {
                assert.equal(awarded, false);

                return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should award dynasty for 6 titles in 8 seasons, but not dynasty_2 or dynasty_3", function () {
            var extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];
            // Add 6 to the existing season, making 7 seasons total
            return addExtraSeasons(g.userTid, g.season, extraSeasons).then(function () {
                return account.checkAchievement.dynasty(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                // Add 1 to the existing 7 seasons, making 8 seasons total
                return addExtraSeasons(g.userTid, g.season + 6, [{playoffRoundsWon: 3}]);
            }).then(function () {
                return account.checkAchievement.dynasty(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should award dynasty and dynasty_2 for 8 titles in 8 seasons, but not dynasty_3", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                // Update non-winning years from last test
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    return tx.teamSeasons.put(teamSeason);
                }).then(function () {
                    return tx.teamSeasons.index("tid, season").get([g.userTid, g.season + 7]);
                }).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.dynasty(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should award dynasty, dynasty_2, and dynasty_3 for 11 titles in 13 seasons if there are 8 contiguous", function () {
            var extraSeasons = [{playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}, {playoffRoundsWon: 4}];

            // Add 5 to the existing season, making 13 seasons total
            return addExtraSeasons(g.userTid, g.season + 7, extraSeasons).then(function () {
                return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                    return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                        teamSeason.playoffRoundsWon = 0;
                        return tx.teamSeasons.put(teamSeason);
                    }).then(function () {
                        return tx.teamSeasons.index("tid, season").get([g.userTid, g.season + 1]);
                    }).then(function (teamSeason) {
                        teamSeason.playoffRoundsWon = 0;
                        return tx.teamSeasons.put(teamSeason);
                    });
                });
            }).then(function () {
                return account.checkAchievement.dynasty(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should award dynasty and dynasty_3 for 11 titles in 13 seasons, but not dynasty_2 if there are not 8 contiguous", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                // Swap a couple titles to make no 8 in a row
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    return tx.teamSeasons.put(teamSeason);
                }).then(function () {
                    return tx.teamSeasons.index("tid, season").get([g.userTid, g.season + 9]);
                }).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 0;
                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.dynasty(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                return account.checkAchievement.dynasty_3(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
    });

    describe("#checkAchievement.moneyball*()", function () {
        it("should award moneyball and moneyball_2 for title with payroll <= $30M", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    teamSeason.expenses.salary.amount = 30000;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.moneyball(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should not award either if didn't win title", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 3;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.moneyball(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should award moneyball but not moneyball_2 for title with payroll > $30M and <= $40M", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    teamSeason.expenses.salary.amount = 40000;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.moneyball(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            }).then(function () {
                return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award either if payroll > $40M", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    teamSeason.expenses.salary.amount = 40001;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.moneyball(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            }).then(function () {
                return account.checkAchievement.moneyball_2(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
    });

    describe("#checkAchievement.hardware_store()", function () {
        it("should award achievement if user's team sweeps awards", function () {
            // tid 7 wins all awards
            var awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":7,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":7,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}};

            return g.dbl.tx("awards", "readwrite", function (tx) {
                return tx.awards.put(awards);
            }).then(function () {
                return account.checkAchievement.hardware_store(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should not award achievement if user's team loses an award", function () {
            // tid 7 wins loses an award!
            var awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":8,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":7,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":7,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}};

            return g.dbl.tx("awards", "readwrite", function (tx) {
                return tx.awards.put(awards);
            }).then(function () {
                return account.checkAchievement.hardware_store(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award achievement if another team sweeps the awards", function () {
            // tid 7 is changed to 8
            var awards = {"season":2013,"roy":{"pid":501,"name":"Timothy Gonzalez","tid":8,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973},"mvp":{"pid":280,"name":"William Jarosz","tid":8,"abbrev":"PHI","pts":28.951219512195124,"trb":11.329268292682928,"ast":0.6585365853658537},"smoy":{"pid":505,"name":"Donald Gallager","tid":8,"abbrev":"MON","pts":22.195121951219512,"trb":7.878048780487805,"ast":0.7682926829268293},"dpoy":{"pid":280,"name":"William Jarosz","tid":8,"abbrev":"PHI","trb":11.329268292682928,"blk":3.2560975609756095,"stl":2.2804878048780486},"finalsMvp":{"pid":335,"name":"Erwin Ritchey","tid":8,"abbrev":"POR","pts":24.4,"trb":8.85,"ast":2.65}};

            return g.dbl.tx("awards", "readwrite", function (tx) {
                return tx.awards.put(awards);
            }).then(function () {
                return account.checkAchievement.hardware_store(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
    });

    describe("#checkAchievement.small_market()", function () {
        it("should award achievement if user's team wins title in a small market", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    teamSeason.pop = 1.5;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.small_market(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should not award achievement if user's team is not in a small market", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 4;
                    teamSeason.pop = 3;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.small_market(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award achievement if user's team does not win the title", function () {
            return g.dbl.tx("teamSeasons", "readwrite", function (tx) {
                return tx.teamSeasons.index("tid, season").get([g.userTid, g.season]).then(function (teamSeason) {
                    teamSeason.playoffRoundsWon = 3;
                    teamSeason.pop = 1.5;

                    return tx.teamSeasons.put(teamSeason);
                });
            }).then(function () {
                return account.checkAchievement.small_market(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
    });

    describe("#checkAchievement.sleeper_pick()", function () {
        it("should award achievement if user's non-lottery pick wins ROY while on user's team", function () {
            return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                assert.equal(awarded, false);

                return g.dbl.tx(["awards", "players"], "readwrite", function (tx) {
                    return tx.players.get(1).then(function (p) {
                        p.tid = g.userTid;
                        p.draft.tid = g.userTid;
                        p.draft.round = 1;
                        p.draft.pick = 20;
                        p.draft.year = g.season - 1;

                        return tx.players.put(p);
                    }).then(function () {
                        // ROY is pid 1 on tid 7
                        var awards = {"season":2013,"roy":{"pid":1,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973}};

                        return tx.awards.put(awards);
                    });
                });
            }).then(function () {
                return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                    assert.equal(awarded, true);
                });
            });
        });
        it("should not award achievement if not currently on user's team", function () {
            return g.dbl.tx("players", "readwrite", function (tx) {
                return tx.players.get(1).then(function (p) {
                    p.tid = 15;

                    return tx.players.put(p);
                });
            }).then(function () {
                return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award achievement if not drafted by user", function () {
            return g.dbl.tx("players", "readwrite", function (tx) {
                return tx.players.get(1).then(function (p) {
                    p.tid = g.userTid;
                    p.draft.tid = 15;

                    return tx.players.put(p);
                });
            }).then(function () {
                return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award achievement if lottery pick", function () {
            return g.dbl.tx("players", "readwrite", function (tx) {
                return tx.players.get(1).then(function (p) {
                    p.draft.tid = g.userTid;
                    p.draft.pick = 7;

                    return tx.players.put(p);
                });
            }).then(function () {
                return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
        it("should not award achievement if old pick", function () {
            return g.dbl.tx("players", "readwrite", function (tx) {
                return tx.players.get(1).then(function (p) {
                    p.draft.pick = 15;
                    p.draft.year = g.season - 2;

                    return tx.players.put(p);
                }).then(function () {
                    return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                        assert.equal(awarded, false);
                    });
                });
            });
        });
        it("should not award achievement not ROY", function () {
            return g.dbl.tx(["awards", "players"], "readwrite", function (tx) {
                // Switch to pid 2
                var awards = {"season":2013,"roy":{"pid":2,"name":"Timothy Gonzalez","tid":7,"abbrev":"ATL","pts":30.135135135135137,"trb":9.18918918918919,"ast":0.7972972972972973}};
                return tx.awards.put(awards).then(function () {
                    return tx.players.get(1).then(function (p) {
                        p.draft.year = g.season - 1;

                        return tx.players.put(p);
                    });
                });
            }).then(function () {
                return account.checkAchievement.sleeper_pick(false).then(function (awarded) {
                    assert.equal(awarded, false);
                });
            });
        });
    });
});
