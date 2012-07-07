define(["core/player"], function (player) {
    "use strict";

    describe('core/player.Player', function () {
        describe('#generate()', function () {
            it('should add stats row only for players on teams, not free agents or undrafted players', function () {
                var gp;

                gp = new player.Player();

                gp.generate(-2, 19, "", 25, 55, 2012);
                gp.p.stats.length.should.equal(0);

                gp.generate(-1, 19, "", 25, 55, 2012);
                gp.p.stats.length.should.equal(0);

                gp.generate(0, 19, "", 25, 55, 2012);
                gp.p.stats.length.should.equal(1);

                gp.generate(15, 19, "", 25, 55, 2012);
                gp.p.stats.length.should.equal(1);
            });
        });
    });
});