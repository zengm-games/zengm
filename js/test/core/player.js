/**
 * @name test.core.player
 * @namespace Tests for core.player.
 */
define(["db", "core/player"], function (db, player) {
    "use strict";

    describe("core/player", function () {
        describe("#generate()", function () {
            it("should add stats row only for players generated on teams, not free agents or undrafted players", function () {
                var p;

                p = player.generate(-2, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(0);

                p = player.generate(-1, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(0);

                p = player.generate(0, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(1);

                p = player.generate(15, 19, "", 25, 55, 2012, false, 15.5);
                p.stats.length.should.equal(1);
            });
        });
    });
});