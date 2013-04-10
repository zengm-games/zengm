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
        });

// New gid - load only box score
// New tid - load only game log list
// New season - load only game log list
// New gid+tid+season - load only box score and game log list
// updateEvent gameSim - update only game log list

    });
});