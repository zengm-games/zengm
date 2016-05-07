const assert = require('assert');
const db = require('../../db');
const g = require('../../globals');
const league = require('../../core/league');
const _ = require('underscore');
const testHelpers = require('../helpers');

describe("core/league", () => {
    before(async () => {
        await db.connectMeta();
        await league.create("Test", 0, undefined, 2013, false);
    });
    // After not needed because last test removes DB

    describe("#create()", () => {
        it("should add entry in meta leagues object store", async () => {
            const l = await g.dbm.leagues.get(g.lid);
            assert.equal(l.name, "Test");
            assert.equal(l.tid, 0);
            assert.equal(l.phaseText, g.startingSeason + " preseason");
        });
        it("should create all necessary object stores", () => {
            assert.equal(g.dbl.objectStoreNames.length, 18);
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
            assert.equal(g.dbl.objectStoreNames.contains("teamSeasons"), true);
            assert.equal(g.dbl.objectStoreNames.contains("teamStats"), true);
            assert.equal(g.dbl.objectStoreNames.contains("trade"), true);
        });
        it("should initialize gameAttributes object store", () => {
            return g.dbl.gameAttributes.getAll().then(function (gameAttributes) {
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
        it("should initialize draftOrder object store", () => {
            return g.dbl.draftOrder.getAll().then(function (draftOrder) {
                assert.equal(draftOrder.length, 1);
                assert.equal(draftOrder[0].rid, 1);
                assert.equal(draftOrder[0].draftOrder.length, 0);
            });
        });
        it("should initialize teams object store", () => {
            return g.dbl.teams.getAll().then(function (teams) {
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
                }
            });
        });
        it("should initialize teamSeasons object store", () => {
            return g.dbl.teamSeasons.getAll().then(function (teamSeasons) {
                assert.equal(teamSeasons.length, g.numTeams);
            });
        });
        it("should initialize teamStats object store", () => {
            return g.dbl.teamStats.getAll().then(function (teamStats) {
                assert.equal(teamStats.length, g.numTeams);
            });
        });
        it("should initialize trade object store", () => {
            return g.dbl.trade.getAll().then(function (tr) {
                assert.equal(tr.length, 1);
                assert.equal(tr[0].rid, 0);
                assert.equal(tr[0].teams.length, 2);
            });
        });
        it("should initialize players object store", () => {
            return g.dbl.players.getAll().then(function (players) {
                assert.equal(players.length, 33 * 14 + 70 * 3);
            });
        });
    });

    describe("#remove()", () => {
        it("should remove league database", () => {
            return league.remove(g.lid);
        });
    });
});
