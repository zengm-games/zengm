// @flow

import assert from "assert";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player } from "../../core";
import { idb } from "..";
import { g } from "../../util";

describe("worker/db/getCopies/playersPlus", () => {
    let p;
    before(async () => {
        testHelpers.resetG();

        g.season = 2011;
        p = player.generate(PLAYER.UNDRAFTED, 19, 2011, false, 28);
        p.tid = 4;
        g.season = 2012;

        await testHelpers.resetCache({
            players: [p],
        });

        p.contract.exp = g.season + 1;

        player.addStatsRow(p);
        player.addStatsRow(p, true);
        player.addStatsRow(p);
        const stats = p.stats;

        stats[0].gp = 5;
        stats[0].fg = 20;

        stats[1].gp = 3;
        stats[1].fg = 30;

        stats[2].season = 2013;
        stats[2].tid = 0;
        stats[2].gp = 8;
        stats[2].fg = 56;

        player.develop(p, 0);

        player.addRatingsRow(p, 15);
        player.develop(p, 0);

        player.addRatingsRow(p, 15);
        p.ratings[2].season = 2013;
        player.develop(p, 0);

        player.addRatingsRow(p, 15);
        p.ratings[3].season = 2014;
        player.develop(p, 0);
    });

    it("return requested info if tid/season match", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg", "fgp", "per"],
            tid: 4,
            season: 2012,
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.tid, 4);
        assert.equal(pf.awards.length, 0);
        assert.equal(pf.ratings.season, 2012);
        assert.equal(typeof pf.ratings.ovr, "number");
        assert.equal(Object.keys(pf.ratings).length, 2);
        assert.equal(pf.stats.season, 2012);
        assert.equal(pf.stats.abbrev, "CIN");
        assert.equal(typeof pf.stats.fg, "number");
        assert.equal(typeof pf.stats.fgp, "number");
        assert.equal(typeof pf.stats.per, "number");
        assert.equal(Object.keys(pf.stats).length, 6);

        assert(!pf.hasOwnProperty("careerStats"));
        assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
    });

    it("return requested info if tid/season match for an array of player objects", async () => {
        const pf = await idb.getCopies.playersPlus([p, p], {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg", "fgp", "per"],
            tid: 4,
            season: 2012,
        });

        for (let i = 0; i < 2; i++) {
            assert.equal(pf[i].tid, 4);
            assert.equal(pf[i].awards.length, 0);
            assert.equal(pf[i].ratings.season, 2012);
            assert.equal(typeof pf[i].ratings.ovr, "number");
            assert.equal(Object.keys(pf[i].ratings).length, 2);
            assert.equal(pf[i].stats.season, 2012);
            assert.equal(pf[i].stats.abbrev, "CIN");
            assert.equal(typeof pf[i].stats.fg, "number");
            assert.equal(typeof pf[i].stats.fgp, "number");
            assert.equal(typeof pf[i].stats.per, "number");
            assert.equal(Object.keys(pf[i].stats).length, 6);

            assert(!pf[i].hasOwnProperty("careerStats"));
            assert(!pf[i].hasOwnProperty("careerStatsPlayoffs"));
        }
    });

    it("return requested info if tid/season match, even when no attrs requested", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg", "fgp", "per"],
            tid: 4,
            season: 2012,
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.ratings.season, 2012);
        assert.equal(typeof pf.ratings.ovr, "number");
        assert.equal(Object.keys(pf.ratings).length, 2);
        assert.equal(pf.stats.season, 2012);
        assert.equal(pf.stats.abbrev, "CIN");
        assert.equal(typeof pf.stats.fg, "number");
        assert.equal(typeof pf.stats.fgp, "number");
        assert.equal(typeof pf.stats.per, "number");
        assert.equal(Object.keys(pf.stats).length, 6);

        assert(!pf.hasOwnProperty("careerStats"));
        assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
    });

    it("return requested info if tid/season match, even when no ratings requested", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            stats: ["season", "abbrev", "fg", "fgp", "per"],
            tid: 4,
            season: 2012,
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.tid, 4);
        assert.equal(pf.awards.length, 0);
        assert(!pf.hasOwnProperty("ratings"));
        assert.equal(pf.stats.season, 2012);
        assert.equal(pf.stats.abbrev, "CIN");
        assert.equal(typeof pf.stats.fg, "number");
        assert.equal(typeof pf.stats.fgp, "number");
        assert.equal(typeof pf.stats.per, "number");
        assert.equal(Object.keys(pf.stats).length, 6);

        assert(!pf.hasOwnProperty("careerStats"));
        assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
    });

    it("return requested info if tid/season match, even when no stats requested", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            tid: 4,
            season: 2012,
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.tid, 4);
        assert.equal(pf.awards.length, 0);
        assert.equal(pf.ratings.season, 2012);
        assert.equal(typeof pf.ratings.ovr, "number");
        assert.equal(Object.keys(pf.ratings).length, 2);
        assert(!pf.hasOwnProperty("stats"));

        assert(!pf.hasOwnProperty("careerStats"));
        assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
    });

    it("return undefined if tid does not match any on record", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg", "fgp", "per"],
            tid: 5,
            season: 2012,
        });

        assert.equal(typeof pf, "undefined");
    });

    it("return undefined if season does not match any on record", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg", "fgp", "per"],
            tid: 4,
            season: 2014,
        });

        assert.equal(typeof pf, "undefined");
    });

    it('return season totals is options.statType is "totals", and per-game averages otherwise', async () => {
        let pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 4,
            season: 2012,
            statType: "totals",
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.stats.gp, 5);
        assert.equal(pf.stats.fg, 20);

        pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 4,
            season: 2012,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.stats.gp, 5);
        assert.equal(pf.stats.fg, 4);
    });

    it("return playoff stats if options.playoffs is true", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 4,
            season: 2012,
            playoffs: true,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.stats[0].playoffs, false);
        assert.equal(pf.stats[0].gp, 5);
        assert.equal(pf.stats[0].fg, 4);
        assert.equal(pf.stats[1].playoffs, true);
        assert.equal(pf.stats[1].gp, 3);
        assert.equal(pf.stats[1].fg, 10);
    });

    it("not return undefined with options.showNoStats even if tid does not match any on record", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 5,
            season: 2012,
            showNoStats: true,
        });
        assert.equal(typeof pf, "object");
    });

    it("not return undefined with options.showNoStats if season does not match any on record", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 4,
            season: 2015,
            showNoStats: true,
        });
        assert.equal(typeof pf, "object");
    });

    it("not return undefined with options.showRookies if the player was drafted this season", async () => {
        g.season = 2011;
        let pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 5,
            season: 2011,
            showRookies: true,
        });
        assert.equal(typeof pf, "object");

        g.season = 2012;
        pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 5,
            season: 2011,
            showRookies: true,
        });
        assert.equal(typeof pf, "undefined");
    });

    it("fuzz ratings if options.fuzz is true", async () => {
        let pf = await idb.getCopy.playersPlus(p, {
            ratings: ["ovr"],
            tid: 4,
            season: 2012,
            fuzz: false,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.ratings.ovr, p.ratings[1].ovr);

        pf = await idb.getCopy.playersPlus(p, {
            ratings: ["ovr"],
            tid: 4,
            season: 2012,
            fuzz: true,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        // This will break if ovr + fuzz is over 100 (should check bounds), but that never happens in practice
        assert.equal(
            pf.ratings.ovr,
            Math.round(p.ratings[1].ovr + p.ratings[1].fuzz),
        );
    });

    it("return stats from previous season if options.oldStats is true and current season has no stats record", async () => {
        g.season = 2013;
        let pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 0,
            season: 2013,
            oldStats: true,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.stats.gp, 8);
        assert.equal(pf.stats.fg, 7);

        pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 0,
            season: 2014,
            oldStats: false,
        });
        assert.equal(typeof pf, "undefined");

        g.season = 2014;
        pf = await idb.getCopy.playersPlus(p, {
            stats: ["gp", "fg"],
            tid: 0,
            season: 2014,
            oldStats: true,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.stats.gp, 8);
        assert.equal(pf.stats.fg, 7);

        g.season = 2012;
    });

    it("adjust cashOwed by options.numGamesRemaining", async () => {
        g.season = 2012;

        let pf = await idb.getCopy.playersPlus(p, {
            attrs: ["cashOwed"],
            tid: 4,
            season: 2012,
            numGamesRemaining: 82,
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.cashOwed, (p.contract.amount * 2) / 1000);

        pf = await idb.getCopy.playersPlus(p, {
            attrs: ["cashOwed"],
            tid: 4,
            season: 2012,
            numGamesRemaining: 41,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.cashOwed, (p.contract.amount * 1.5) / 1000);

        pf = await idb.getCopy.playersPlus(p, {
            attrs: ["cashOwed"],
            tid: 4,
            season: 2012,
            numGamesRemaining: 0,
        });
        if (!pf) {
            throw new Error("Missing player");
        }
        assert.equal(pf.cashOwed, p.contract.amount / 1000);
    });

    it("return stats and ratings from all seasons and teams if no season or team is specified", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg"],
            statType: "totals",
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.tid, 4);
        assert.equal(pf.awards.length, 0);
        assert.equal(pf.ratings[0].season, 2011);
        assert.equal(typeof pf.ratings[0].ovr, "number");
        assert.equal(pf.ratings[1].season, 2012);
        assert.equal(typeof pf.ratings[1].ovr, "number");
        assert.equal(pf.ratings[2].season, 2013);
        assert.equal(typeof pf.ratings[2].ovr, "number");
        assert.equal(pf.stats[0].season, 2012);
        assert.equal(pf.stats[0].abbrev, "CIN");
        assert.equal(pf.stats[0].fg, 20);
        assert.equal(pf.stats[1].season, 2013);
        assert.equal(pf.stats[1].abbrev, "ATL");
        assert.equal(pf.stats[1].fg, 56);
        assert.equal(pf.careerStats.fg, 76);

        assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
    });

    it("return stats and ratings from all seasons with a specific team if no season is specified but a team is", async () => {
        const pf = await idb.getCopy.playersPlus(p, {
            attrs: ["tid", "awards"],
            ratings: ["season", "ovr"],
            stats: ["season", "abbrev", "fg"],
            tid: 4,
            statType: "totals",
        });
        if (!pf) {
            throw new Error("Missing player");
        }

        assert.equal(pf.tid, 4);
        assert.equal(pf.awards.length, 0);
        assert.equal(pf.ratings[0].season, 2012);
        assert.equal(typeof pf.ratings[0].ovr, "number");
        assert.equal(pf.ratings.length, 1);
        assert.equal(pf.stats[0].season, 2012);
        assert.equal(pf.stats[0].abbrev, "CIN");
        assert.equal(pf.stats[0].fg, 20);
        assert.equal(pf.stats.length, 1);
        assert.equal(pf.careerStats.fg, 20);

        assert(!pf.hasOwnProperty("careerStatsPlayoffs"));
    });
});
