(function () {
    "use strict";
    var agingYears, baseRating, draftYear, i, j, p, player, pot, profile, profiles, random;

    random = require("util/random");
    player = require("core/player");

    profiles = ["Point", "Wing", "Big", "Big", ""];
    for (i = 0; i < 1; i++) {
        baseRating = 20;
        pot = 80;
        if (pot < baseRating) {
            pot = baseRating;
        }
        if (pot > 90) {
            pot = 90;
        }

        profile = profiles[random.randInt(0, profiles.length - 1)];
        agingYears = 16;
        draftYear = g.season;

        p = player.generate(c.PLAYER_UNDRAFTED, 19, profile, baseRating, pot, draftYear);
        console.log(p.ratings[0].ovr + " " + p.ratings[0].pot);

        p = player.develop(p, agingYears);
        console.log(p.ratings[0].ovr + " " + p.ratings[0].pot);
        console.log('');
    }
}());