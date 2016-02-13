'use strict';

var assert = require('assert');
var dao = require('../../dao');
var db = require('../../db');
var g = require('../../globals');
var league = require('../../core/league');
var _ = require('underscore');
var testHelpers = require('../helpers');

describe("core/league", function () {
    before(function () {
        return db.connectMeta().then(function () {
            return league.create("Test", 0, undefined, 2013, false);
        });
    });
    // After not needed because last test removes DB

    describe("#create()", function () {
        it("should add entry in meta leagues object store", function () {
            return g.dbm.leagues.get(g.lid).then(function (l) {
                assert.equal(l.name, "Test");
                assert.equal(l.tid, 0);
                assert.equal(l.phaseText, g.startingSeason + " preseason");
            });
        });
        it("should create all necessary object stores", function () {
            assert.equal(g.dbl.objectStoreNames.length, 16);
            assert.equal(g.dbl.objectStoreNames.contains("awards"), true);
            assert.equal(g.dbl.objectStoreNames.contains("events"), true);
            assert.equal(g.dbl.objectStoreNames.contains("draftOrder"), true);
            assert.equal(g.dbl.objectStoreNames.contains("gameAttributes"), true);
            assert.equal(g.dbl.objectStoreNames.contains("games"), true);
            assert.equal(g.dbl.objectStoreNames.contains("messages"), true);
            assert.equal(g.dbl.objectStoreNames.contains("negotiations"), true);
            assert.equal(g.dbl.objectStoreNames.contains("players"), true);
            assert.equal(g.dbl.objectStoreNames.contains("playerFeats"), true);
            assert.equal(g.dbl.objectStoreNames.contains("playerStats"), true);
            assert.equal(g.dbl.objectStoreNames.contains("playoffSeries"), true);
            assert.equal(g.dbl.objectStoreNames.contains("releasedPlayers"), true);
            assert.equal(g.dbl.objectStoreNames.contains("schedule"), true);
            assert.equal(g.dbl.objectStoreNames.contains("teams"), true);
            assert.equal(g.dbl.objectStoreNames.contains("trade"), true);
        });
        it("should initialize gameAttributes object store", function () {
            return dao.gameAttributes.getAll().then(function (gameAttributes) {
                var count, gTest, key;

                gTest = gameAttributes.reduce(function (obj, row) { obj[row.key] = row.value; return obj; }, {});

                assert.equal(gTest.gamesInProgress, false);
                assert.equal(typeof gTest.lastDbChange, "number");
                assert.equal(gTest.leagueName, "Test");
                assert.equal(gTest.phase, 0);
                assert.equal(gTest.phaseText, gTest.startingSeason + " preseason");
                assert.equal(gTest.season, gTest.startingSeason);
                assert.equal(gTest.statusText, "Idle");
                assert.equal(gTest.stopGames, false);
                assert.equal(gTest.userTid, 0);
                assert.equal(gTest.gameOver, false);
                assert.equal(gTest.daysLeft, 0);
                assert.equal(gTest.showFirstOwnerMessage, true);

                count = 0;
                for (key in gTest) {
                    if (gTest.hasOwnProperty(key)) {
                        count += 1;
                    }
                }

                assert.equal(count, 28);
            });
        });
        it("should initialize draftOrder object store", function () {
            return dao.draftOrder.getAll().then(function (draftOrder) {
                assert.equal(draftOrder.length, 1);
                assert.equal(draftOrder[0].rid, 1);
                assert.equal(draftOrder[0].draftOrder.length, 0);
            });
        });
        it("should initialize teams object store", function () {
            return dao.teams.getAll().then(function (teams) {
                var cids, dids, i;

                cids = _.pluck(teams, "cid");
                dids = _.pluck(teams, "did");

                assert.equal(teams.length, g.numTeams);
                for (i = 0; i < 2; i++) {
                    assert.equal(testHelpers.numInArrayEqualTo(cids, i), 15);
                }
                for (i = 0; i < 6; i++) {
                    assert.equal(testHelpers.numInArrayEqualTo(dids, i), 5);
                }
                for (i = 0; i < g.numTeams; i++) {
                    assert.equal(typeof teams[i].name, "string");
                    assert.equal(typeof teams[i].region, "string");
                    assert.equal(typeof teams[i].tid, "number");
                    assert.equal(teams[i].seasons.length, 1);
                    assert.equal(teams[i].stats.length, 1);
                }
            });
        });
        it("should initialize trade object store", function () {
            return dao.trade.getAll().then(function (tr) {
                assert.equal(tr.length, 1);
                assert.equal(tr[0].rid, 0);
                assert.equal(tr[0].teams.length, 2);
            });
        });
        it("should initialize players object store", function () {
            return dao.players.getAll().then(function (players) {
                assert.equal(players.length, 33 * 14 + 70 * 3);
            });
        });
    });

    describe("#remove()", function () {
        it("should remove league database", function () {
            return league.remove(g.lid);
        });
    });
});
