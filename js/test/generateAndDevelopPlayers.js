(function () {
    "use strict";
    var agingYears, baseRating, draftYear, i, j, p, player, pot, profile, profiles, random;

    random = require("util/random");
    player = require("core/player");

    profiles = ["Point", "Wing", "Big", "Big", ""];
    for (i = 0; i < 1; i++) {
        baseRating = random.randInt(8, 33);
        pot = parseInt(random.gauss(50, 20), 10);
        if (pot < baseRating) {
            pot = baseRating;
        }
        if (pot > 90) {
            pot = 90;
        }

        profile = profiles[random.randInt(0, profiles.length - 1)];
        agingYears = 12;
        draftYear = g.season;

        p = player.generate(g.PLAYER.UNDRAFTED, 19, profile, baseRating, pot, draftYear);
        console.log(p.ratings[0].ovr + " " + p.ratings[0].pot);

        p = player.develop(p, agingYears, true);
        console.log(p.ratings[0].ovr + " " + p.ratings[0].pot);
    }
}());