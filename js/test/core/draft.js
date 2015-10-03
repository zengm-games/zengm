/**
 * @name test.core.draft
 * @namespace Tests for core.draft.
 */
'use strict';

var dao = require('../../dao');
var db = require('../../db');
var g = require('../../globals');
var draft = require('../../core/draft');
var league = require('../../core/league');
var team = require('../../core/team');
var sampleTiebreakers = require('../lib/require.text!test/fixtures/sample_tiebreakers.json');
var Promise = require('../bluebird');
var $ = require('../lib/jquery');
var _ = require('../underscore');

sampleTiebreakers = JSON.parse(sampleTiebreakers);

describe("core/draft", function () {
    var testDraftUntilUserOrEnd, testDraftUser, userPick1, userPick2;

    before(function () {
        return db.connectMeta().then(function () {
            return league.create("Test", 15, undefined, 2015, false);
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
            if (round === 1) {
                pick.pick.should.equal(userPick1);
            } else {
                pick.pick.should.equal(userPick2 - 30);
            }
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
                        return draft.setOrder(null, draftOrder);
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
        var draftResults, i;
        it("should schedule 60 draft picks", function () {
            var tx;

            tx = dao.tx(["draftOrder", "draftPicks", "teams", "players"], "readwrite");
            return dao.teams.iterate({
                ot: tx,
                callback: function (t) {
                    return sampleTiebreakers.teams[t.tid]; // load static data
                }
            }).then(function () {
                return draft.genOrder(tx);
            }).then(function () {
                return draft.getOrder(tx);
            }).then(function (draftOrder) {
                draftOrder.length.should.equal(60);
                draftResults = _.pluck(draftOrder, "originalTid");
                userPick1 = draftResults.indexOf(g.userTid) + 1;
                userPick2 = draftResults.lastIndexOf(g.userTid) + 1;
            });
        });
        it("should give the 3 teams with the lowest win percentage picks not lower than 6", function () {
            var tids = [16, 28, 21]; // teams with lowest winp
            for (i = 0; i < tids.length; i++) {
                draftResults.indexOf(tids[i]).should.be.within(0, i + 3);
                draftResults.lastIndexOf(tids[i]).should.be.equal(30 + i);
            }
        });

        it("should give lottery team with better record than playoff teams a pick based on actual record for round 2", function () {
            var pofteams = [23, 10, 18, 24, 14];

            // good record lottery team
            draftResults.indexOf(17).should.be.within(0, 13);
            draftResults.lastIndexOf(17).should.be.equal(48);

            // bad record playoff team
            for (i = 0; i < pofteams.length; i++) {
                draftResults.indexOf(pofteams[i]).should.be.above(draftResults.indexOf(17));
                draftResults.lastIndexOf(pofteams[i]).should.be.below(draftResults.lastIndexOf(17));
            }
        });

        it("should give reverse round 2 order for teams with the same record", function () {
            var j, r1picks, r2picks, sameRec, tids;
            sameRec = [
                [3, 15, 25],
                [10, 18],
                [13, 26]
            ];
            for (i = 0; i < sameRec.length; i++) {
                tids = sameRec[i];
                r1picks = [];
                r2picks = [];
                for (j = 0; j < 30; j++) {
                    if (tids.indexOf(draftResults[j]) > -1) {
                        r1picks.push(draftResults[j]);
                    }
                }
                for (j = 59; j > 29; j--) {
                    if (tids.indexOf(draftResults[j]) > -1) {
                        r2picks.push(draftResults[j]);
                    }
                }
                r1picks.length.should.equal(r2picks.length);
                for (j = 0; j < r1picks.length; j++) {
                    r1picks[j].should.equal(r2picks[j]);
                }
            }
        });
    });

    describe("#updateChances()", function () {
        it("should distribute combinations to teams with the same record", function () {
            var tx = dao.tx(["draftOrder", "draftPicks", "teams"], "readwrite");
            return team.filter({
                ot: tx,
                attrs: ["tid", "cid"],
                seasonAttrs: ["winp", "playoffRoundsWon"],
                season: g.season
            }).then(function (teams) {
                var chances, i, j, maxIdx, sameRec, tids, value;
                chances = [250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5];
                // index instead of tid
                sameRec = [
                    [6, 7, 8],
                    [10, 11, 12]
                ];
                draft.lotterySort(teams);
                draft.updateChances(chances, teams, false);
                for (i = 0; i < sameRec.length; i++) {
                    tids = sameRec[i];
                    value = 0;
                    for (j = 0; j < tids.length; j++) {
                        if (value === 0) {
                            value = chances[tids[j]];
                        } else {
                            value.should.equal(chances[tids[j]]);
                        }
                    }
                }

                // test if isFinal is true
                draft.updateChances(chances, teams, true);
                for (i = 0; i < sameRec.length; i++) {
                    tids = sameRec[i];
                    value = 0;
                    maxIdx = -1;
                    for (j = tids.length - 1; j >= 0; j--) {
                        if (value <= chances[tids[j]]) {
                            value = chances[tids[j]];
                            maxIdx = j;
                        }
                    }
                    maxIdx.should.be.equal(0);
                }
            });
        });
    });

    describe("#selectPlayer() and #untilUserOrEnd()", function () {
        it("should draft  players before the user's team first round pick", function () {
            return testDraftUntilUserOrEnd(userPick1 - 1, userPick1 - 1);
        });
        it("should then allow the user to draft in the first round", function () {
            return testDraftUser(1);
        });
        it("when called again after the user drafts, should draft players before the user's second round pick comes up", function () {
            return testDraftUntilUserOrEnd(userPick2 - userPick1 - 1, userPick2 - 1);
        });
        it("should then allow the user to draft in the second round", function () {
            return testDraftUser(2);
        });
        it("when called again after the user drafts, should draft more players to finish the draft", function () {
            var after = 60 - userPick2;
            return testDraftUntilUserOrEnd(after, userPick2 + after);
        });
    });
});

