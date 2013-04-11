/**
 * @name test.views.gameLog
 * @namespace Tests for views.gameLog.
 */
define(["db", "globals", "core/league", "lib/jquery", "views/gameLog"], function (db, g, league, $, gameLog) {
    "use strict";

    describe("views/gameLog", function () {
        before(function (done) {
            db.connectMeta(function () {
                league.create("Test", 0, "random", function () {
                    done();
                });
            });
            $("body").append('<div id="testsWrapper" style="visibility: hidden;"><div id="league_content"></div></div>');
        });
        after(function (done) {
            league.remove(g.lid, done);
            $("#testsWrapper").remove();
        });
        afterEach(function () {
console.log("HI");
            document.getElementById("league_content").dataset.id = "";
            document.getElementById("league_content").innerHTML = "";
        });

        describe("#update()", function () {
            it("should load complete UI if gameLog is not already loaded", function (done) {
                should.not.exist(document.getElementById("game-log-dropdown"));
                should.not.exist(document.getElementById("box-score"));
                should.not.exist(document.getElementById("game-log-list"));
                gameLog.update("CHI", g.season, -1, undefined, function () {
                    should.exist(document.getElementById("game-log-dropdown"));
                    should.exist(document.getElementById("box-score"));
                    should.exist(document.getElementById("game-log-list"));
                    done();
                });
            });
            it("should load nothing if gameLog is already open with same parameters", function (done) {
                should.not.exist(document.getElementById("game-log-dropdown"));
                should.not.exist(document.getElementById("box-score"));
                should.not.exist(document.getElementById("game-log-list"));
                gameLog.update("CHI", g.season, -1, undefined, function () {
                    should.exist(document.getElementById("game-log-dropdown"));
                    should.exist(document.getElementById("box-score"));
                    should.exist(document.getElementById("game-log-list"));
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

        });

// New gid - load only box score
// New tid - load only game log list
// New season - load only game log list
// New gid+tid+season - load only box score and game log list
// updateEvent gameSim - update only game log list

    });
});