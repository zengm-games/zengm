define(["core/player", "core/season"], function (player, season) {
    "use strict";

    describe('core/player', function () {
        describe('#generate()', function () {
            it('should add stats row only for players generated on teams, not free agents or undrafted players', function () {
                var p;

                p = player.generate(-2, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(0);

                p = player.generate(-1, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(0);

                p = player.generate(0, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(1);

                p = player.generate(15, 19, "", 25, 55, 2012);
                p.stats.length.should.equal(1);
            });
        });
    });

    describe('core/season', function () {
        describe('#newSchedule()', function () {
            it('should schedule 1230 games (82 each for 30 teams)', function (done) {
                season.newSchedule(function (schedule) {
                    schedule.length.should.equal(1230);
                    done();
                });
            });
        });
    });
});