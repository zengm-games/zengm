/**
 * @name test.core.league
 * @namespace Tests for core.league.
 */
define(["db", "globals", "core/league", "lib/underscore", "test/helpers"], function (db, g, league, _, testHelpers) {
    "use strict";

    describe("core/league", function () {
        var testDraftUntilUserOrEnd, testDraftUser;

        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 0, undefined, 2013, false, function () {
                    done();
                });
            });
        });

        describe("#create()", function () {
            it("should add entry in meta leagues object store", function (done) {
                g.dbm.transaction("leagues").objectStore("leagues").get(g.lid).onsuccess = function (event) {
                    event.target.result.name.should.equal("Test");
                    event.target.result.tid.should.equal(0);
                    event.target.result.phaseText.should.equal(g.startingSeason + " regular season");
                    done();
                };
            });
            it("should create all necessary object stores", function () {
                g.dbl.objectStoreNames.should.have.length(14);
                g.dbl.objectStoreNames.contains("awards").should.equal(true);
                g.dbl.objectStoreNames.contains("events").should.equal(true);
                g.dbl.objectStoreNames.contains("draftOrder").should.equal(true);
                g.dbl.objectStoreNames.contains("gameAttributes").should.equal(true);
                g.dbl.objectStoreNames.contains("games").should.equal(true);
                g.dbl.objectStoreNames.contains("messages").should.equal(true);
                g.dbl.objectStoreNames.contains("negotiations").should.equal(true);
                g.dbl.objectStoreNames.contains("players").should.equal(true);
                g.dbl.objectStoreNames.contains("playoffSeries").should.equal(true);
                g.dbl.objectStoreNames.contains("releasedPlayers").should.equal(true);
                g.dbl.objectStoreNames.contains("schedule").should.equal(true);
                g.dbl.objectStoreNames.contains("teams").should.equal(true);
                g.dbl.objectStoreNames.contains("trade").should.equal(true);
            });
            it("should initialize gameAttributes object store", function (done) {
                g.dbl.transaction("gameAttributes").objectStore("gameAttributes").getAll().onsuccess = function (event) {
                    var count, gTest, key;

                    gTest = _.reduce(event.target.result, function (obj, row) { obj[row.key] = row.value; return obj; }, {});

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

                    done();
                };
            });
            it("should initialize draftOrder object store", function (done) {
                g.dbl.transaction("draftOrder").objectStore("draftOrder").getAll().onsuccess = function (event) {
                    event.target.result.should.have.length(1);
                    event.target.result[0].rid.should.equal(1);
                    event.target.result[0].draftOrder.should.have.length(0);
                    done();
                };
            });
            it("should initialize teams object store", function (done) {
                g.dbl.transaction("teams").objectStore("teams").getAll().onsuccess = function (event) {
                    var cids, dids, i, teams;

                    teams = event.target.result;
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

                    done();
                };
            });
            it("should initialize trade object store", function (done) {
                g.dbl.transaction("trade").objectStore("trade").getAll().onsuccess = function (event) {
                    event.target.result.should.have.length(1);
                    event.target.result[0].rid.should.equal(0);
                    event.target.result[0].teams.should.have.length(2);
                    done();
                };
            });
            it("should initialize players object store", function (done) {
                g.dbl.transaction("players").objectStore("players").getAll().onsuccess = function (event) {
                    event.target.result.should.have.length(33 * 14 + 70 * 3);
                    done();
                };
            });
        });

        describe("#remove()", function () {
            it("should remove league database", function (done) {
                league.remove(g.lid, done);
            });
        });
    });
});