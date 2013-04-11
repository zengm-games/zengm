/**
 * @name test.views.gameLog
 * @namespace Tests for views.gameLog.
 */
define(["db", "globals", "core/league", "lib/jquery", "views/gameLog"], function (db, g, league, $, gameLog) {
    "use strict";

    function confirmNotBuilt() {
        should.not.exist(document.getElementById("game-log-dropdown"));
        should.not.exist(document.getElementById("box-score"));
        should.not.exist(document.getElementById("game-log-list"));
    }

    function confirmBuilt() {
        should.exist(document.getElementById("game-log-dropdown"));
        should.exist(document.getElementById("box-score"));
        should.exist(document.getElementById("game-log-list"));
    }

    function addFakeGame(tx, gid) {
        var game, j, k;

        game = {
            gid: gid,
            season: g.season,
            teams: [
                {
                    pts: 100,
                    tid: 0,
                    players: []
                },
                {
                    pts: 105,
                    tid: 4,
                    players: []
                }
            ],
            overtimes: 0
        };
        for (j = 0; j < 2; j++) {
            for (k = 0; k < 7; k++) {
                game.teams[j].players.push({
                    gs: 0,
                    min: 40,
                    injury: {type: "Healthy", gamesRemaining: 0}
                });
            }
        }
        tx.objectStore("games").add(game);
    }

    describe("views/gameLog", function () {
        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 0, "random", function () {
                    var i, tx;

                    tx = g.dbl.transaction("games", "readwrite");
                    for (i = 0; i < 10; i++) {
                        addFakeGame(tx, i);
                    }
                    tx.oncomplete = function () {
                        done();
                    };
                });
            });
            $("body").append('<div id="testsWrapper" style="visibility: hidden;"><div id="league_content"></div></div>');
        });
        after(function (done) {
            league.remove(g.lid, done);
            $("#testsWrapper").remove();
        });
        afterEach(function () {
            document.getElementById("league_content").dataset.id = "";
            document.getElementById("league_content").innerHTML = "";
        });

        describe("#update()", function () {
            it("should load complete UI if gameLog is not already loaded", function (done) {
                confirmNotBuilt();
                gameLog.update("CHI", g.season, -1, undefined, function () {
                    confirmBuilt();
                    done();
                });
            });
            it("should load and update nothing if gameLog is already loaded with same parameters", function (done) {
                confirmNotBuilt();
                gameLog.update("CHI", g.season, -1, undefined, function () {
                    confirmBuilt();

                    document.getElementById("game-log-dropdown-seasons").dataset.dummy = "shit";
                    document.getElementById("box-score").innerHTML = "fuck";
                    document.getElementById("game-log-list").innerHTML = "cunt";
                    gameLog.update("CHI", g.season, -1, undefined, function () {
                        document.getElementById("game-log-dropdown-seasons").dataset.dummy.should.equal("shit");
                        document.getElementById("box-score").innerHTML.should.equal("fuck");
                        document.getElementById("game-log-list").innerHTML.should.equal("cunt");
                        done();
                    });
                });
            });
            it("should load only a new box score if everything is the same except the game ID", function (done) {
                confirmNotBuilt();
                gameLog.update("CHI", g.season, -1, undefined, function () {
                    confirmBuilt();

                    document.getElementById("game-log-dropdown-seasons").dataset.dummy = "shit";
                    document.getElementById("box-score").innerHTML = "fuck";
                    document.getElementById("game-log-list").innerHTML = "cunt";
                    gameLog.update("CHI", g.season, 5, undefined, function () {
                        document.getElementById("game-log-dropdown-seasons").dataset.dummy.should.equal("shit");
                        document.getElementById("box-score").innerHTML.should.not.equal("fuck");
                        document.getElementById("game-log-list").innerHTML.should.equal("cunt");
                        done();
                    });
                });
            });
            it("should load only a new game log list if everything is the same except the team", function (done) {
                confirmNotBuilt();
                gameLog.update("CHI", g.season, 3, undefined, function () {
                    confirmBuilt();

                    document.getElementById("game-log-dropdown-seasons").dataset.dummy = "shit";
                    document.getElementById("box-score").innerHTML = "fuck";
                    document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(10);
                    gameLog.update("BOS", g.season, 3, undefined, function () {
                        document.getElementById("game-log-dropdown-seasons").dataset.dummy.should.equal("shit");
                        document.getElementById("box-score").innerHTML.should.equal("fuck");
                        document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(0);
                        done();
                    });
                });
            });
            it("should load only a new game log list if everything is the same except the season", function (done) {
                confirmNotBuilt();
                gameLog.update("ATL", g.season, 3, undefined, function () {
                    confirmBuilt();

                    document.getElementById("game-log-dropdown-seasons").dataset.dummy = "shit";
                    document.getElementById("box-score").innerHTML = "fuck";
                    document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(10);
                    gameLog.update("ATL", g.season + 1, 3, undefined, function () {
                        document.getElementById("game-log-dropdown-seasons").dataset.dummy.should.equal("shit");
                        document.getElementById("box-score").innerHTML.should.equal("fuck");
                        document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(0);
                        done();
                    });
                });
            });
            it("should load only a new game log list and box score if game ID, team, and season all change", function (done) {
                confirmNotBuilt();
                gameLog.update("ATL", g.season, -1, undefined, function () {
                    confirmBuilt();

                    document.getElementById("game-log-dropdown-seasons").dataset.dummy = "shit";
                    document.getElementById("box-score").innerHTML = "fuck";
                    document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(10);
                    gameLog.update("BOS", g.season + 1, 3, undefined, function () {
                        document.getElementById("game-log-dropdown-seasons").dataset.dummy.should.equal("shit");
                        document.getElementById("box-score").innerHTML.should.not.equal("fuck");
                        document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(0);
                        done();
                    });
                });
            });
            it("should update only game log list in response to gameSim updateEvent, if all other parameters are the same", function (done) {
                confirmNotBuilt();
                gameLog.update("ATL", g.season, 3, undefined, function () {
                    var child, i, tx;

                    confirmBuilt();

                    document.getElementById("game-log-dropdown-seasons").dataset.dummy = "shit";
                    document.getElementById("box-score").innerHTML = "fuck";
                    document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(10);

                    // Remove  a row, to make sure that the old games will not be subsequently updated
                    child = document.getElementById("game-log-list").querySelector("tbody tr");
                    child.parentNode.removeChild(child);

                    // Add fake games
                    tx = g.dbl.transaction("games", "readwrite");
                    for (i = 10; i < 20; i++) {
                        addFakeGame(tx, i);
                    }
                    tx.oncomplete = function () {
                        gameLog.update("ATL", g.season, 3, "gameSim", function () {
                            document.getElementById("game-log-dropdown-seasons").dataset.dummy.should.equal("shit");
                            document.getElementById("box-score").innerHTML.should.equal("fuck");
                            document.getElementById("game-log-list").querySelectorAll("tbody tr").should.have.length(19);
                            done();
                        });
                    };
                });
            });
        });
    });
});