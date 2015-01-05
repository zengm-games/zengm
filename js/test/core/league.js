/**
 * @name test.core.league
 * @namespace Tests for core.league.
 */
define(["dao", "db", "globals", "core/league", "lib/underscore", "test/helpers"], function (dao, db, g, league, _, testHelpers) {
    "use strict";

    describe("core/league", function () {
        before(function () {
            return db.connectMeta().then(function () {
                return league.create("Test", 0, undefined, 2013, false);
            });
        });
        // After not needed because last test removes DB

        describe("#create()", function () {
            it("should add entry in meta leagues object store", function () {
                return dao.leagues.get({key: g.lid}).then(function (l) {
                    l.name.should.equal("Test");
                    l.tid.should.equal(0);
                    l.phaseText.should.equal(g.startingSeason + " regular season");
                });
            });
            it("should create all necessary object stores", function () {
                g.dbl.objectStoreNames.should.have.length(15);
                g.dbl.objectStoreNames.contains("awards").should.equal(true);
                g.dbl.objectStoreNames.contains("events").should.equal(true);
                g.dbl.objectStoreNames.contains("draftOrder").should.equal(true);
                g.dbl.objectStoreNames.contains("gameAttributes").should.equal(true);
                g.dbl.objectStoreNames.contains("games").should.equal(true);
                g.dbl.objectStoreNames.contains("messages").should.equal(true);
                g.dbl.objectStoreNames.contains("negotiations").should.equal(true);
                g.dbl.objectStoreNames.contains("players").should.equal(true);
                g.dbl.objectStoreNames.contains("playerStats").should.equal(true);
                g.dbl.objectStoreNames.contains("playoffSeries").should.equal(true);
                g.dbl.objectStoreNames.contains("releasedPlayers").should.equal(true);
                g.dbl.objectStoreNames.contains("schedule").should.equal(true);
                g.dbl.objectStoreNames.contains("teams").should.equal(true);
                g.dbl.objectStoreNames.contains("trade").should.equal(true);
            });
            it("should initialize gameAttributes object store", function () {
                return dao.gameAttributes.getAll().then(function (gameAttributes) {
                    var count, gTest, key;

                    gTest = gameAttributes.reduce(function (obj, row) { obj[row.key] = row.value; return obj; }, {});

                    gTest.gamesInProgress.should.equal(false);
                    gTest.lastDbChange.should.be.a("number");
                    gTest.leagueName.should.equal("Test");
                    gTest.phase.should.equal(1);
                    gTest.phaseText.should.equal(gTest.startingSeason + " regular season");
                    gTest.season.should.equal(gTest.startingSeason);
                    gTest.statusText.should.equal("Idle");
                    gTest.stopGames.should.equal(false);
                    gTest.userTid.should.equal(0);
                    gTest.gameOver.should.equal(false);
                    gTest.daysLeft.should.equal(0);
                    gTest.showFirstOwnerMessage.should.equal(false);

                    count = 0;
                    for (key in gTest) {
                        if (gTest.hasOwnProperty(key)) {
                            count += 1;
                        }
                    }

                    count.should.equal(20);
                });
            });
            it("should initialize draftOrder object store", function () {
                return dao.draftOrder.getAll().then(function (draftOrder) {
                    draftOrder.should.have.length(1);
                    draftOrder[0].rid.should.equal(1);
                    draftOrder[0].draftOrder.should.have.length(0);
                });
            });
            it("should initialize teams object store", function () {
                return dao.teams.getAll().then(function (teams) {
                    var cids, dids, i;

                    cids = _.pluck(teams, "cid");
                    dids = _.pluck(teams, "did");

                    teams.should.have.length(g.numTeams);
                    for (i = 0; i < 2; i++) {
                        testHelpers.numInArrayEqualTo(cids, i).should.equal(15);
                    }
                    for (i = 0; i < 6; i++) {
                        testHelpers.numInArrayEqualTo(dids, i).should.equal(5);
                    }
                    for (i = 0; i < g.numTeams; i++) {
                        teams[i].name.should.be.a("string");
                        teams[i].region.should.be.a("string");
                        teams[i].tid.should.be.a("number");
                        teams[i].seasons.should.have.length(1);
                        teams[i].stats.should.have.length(1);
                    }
                });
            });
            it("should initialize trade object store", function () {
                return dao.trade.getAll().then(function (tr) {
                    tr.should.have.length(1);
                    tr[0].rid.should.equal(0);
                    tr[0].teams.should.have.length(2);
                });
            });
            it("should initialize players object store", function () {
                return dao.players.getAll().then(function (players) {
                    players.should.have.length(33 * 14 + 70 * 3);
                });
            });
        });

        describe("#remove()", function () {
            it("should remove league database", function () {
                return league.remove(g.lid);
            });
        });
    });
});