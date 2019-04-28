// @flow

import assert from "assert";
import testHelpers from "../../../test/helpers";
import { player, team } from "../../core";
import { idb } from "..";
import { g, helpers } from "../../util";

describe("worker/db/getCopies/teamsPlus", () => {
    before(async () => {
        testHelpers.resetG();
        g.season = 2013;

        const teamsDefault = helpers.getTeamsDefault();
        await testHelpers.resetCache({
            players: [player.generate(4, 30, 2010, true, 15.5)],
            teams: teamsDefault.map(team.generate),
            teamSeasons: teamsDefault.map(t => team.genSeasonRow(t.tid)),
            teamStats: teamsDefault.map(t => team.genStatsRow(t.tid)),
        });

        // $FlowFixMe
        const teamStats = await idb.cache.teamSeasons.indexGet(
            "teamStatsByPlayoffsTid",
            [false, 4],
        );
        if (!teamStats) {
            throw new Error("Missing teamStats");
        }
        teamStats.gp = 10;
        teamStats.fg = 50;
        teamStats.fga = 100;
        await idb.cache.teamStats.put(teamStats);

        const teamStats2 = team.genStatsRow(4, true);
        teamStats2.gp = 4;
        teamStats2.fg = 12;
        teamStats2.fga = 120;
        await idb.cache.teamStats.add(teamStats2);
    });

    it("return requested info if tid/season match", async () => {
        const t = await idb.getCopy.teamsPlus({
            attrs: ["tid", "abbrev"],
            seasonAttrs: ["season", "won", "payroll"],
            stats: ["gp", "fg", "fgp"],
            tid: 4,
            season: g.season,
        });
        if (!t) {
            throw new Error("Missing team");
        }

        assert(t.seasonAttrs.payroll > 0);
        assert.deepEqual(t, {
            tid: 4,
            abbrev: "CIN",
            seasonAttrs: {
                season: g.season,
                won: 0,
                payroll: t.seasonAttrs.payroll,
            },
            stats: {
                gp: 10,
                fg: 5,
                fgp: 50,
                playoffs: false,
            },
        });
    });

    it("return an array if no team ID is specified", async () => {
        const teams = await idb.getCopies.teamsPlus({
            attrs: ["tid", "abbrev"],
            seasonAttrs: ["season", "won"],
            stats: ["gp", "fg", "fgp"],
            season: g.season,
        });

        assert.equal(teams.length, g.numTeams);
        const t = teams[4];
        assert.deepEqual(t, {
            tid: 4,
            abbrev: "CIN",
            seasonAttrs: {
                season: g.season,
                won: 0,
            },
            stats: {
                gp: 10,
                fg: 5,
                fgp: 50,
                playoffs: false,
            },
        });
    });

    it("return requested info if tid/season match, even when no attrs requested", async () => {
        const t = await idb.getCopy.teamsPlus({
            seasonAttrs: ["season", "won"],
            stats: ["gp", "fg", "fgp"],
            tid: 4,
            season: g.season,
        });

        assert.deepEqual(t, {
            seasonAttrs: {
                season: g.season,
                won: 0,
            },
            stats: {
                gp: 10,
                fg: 5,
                fgp: 50,
                playoffs: false,
            },
        });
    });

    it("return requested info if tid/season match, even when no seasonAttrs requested", async () => {
        const t = await idb.getCopy.teamsPlus({
            attrs: ["tid", "abbrev"],
            stats: ["gp", "fg", "fgp"],
            tid: 4,
            season: g.season,
        });

        assert.deepEqual(t, {
            tid: 4,
            abbrev: "CIN",
            stats: {
                gp: 10,
                fg: 5,
                fgp: 50,
                playoffs: false,
            },
        });
    });

    it("return requested info if tid/season match, even when no stats requested", async () => {
        const t = await idb.getCopy.teamsPlus({
            attrs: ["tid", "abbrev"],
            seasonAttrs: ["season", "won"],
            tid: 4,
            season: g.season,
        });

        assert.deepEqual(t, {
            tid: 4,
            abbrev: "CIN",
            seasonAttrs: {
                season: g.season,
                won: 0,
            },
        });
    });

    it("return season totals if statType is 'totals'", async () => {
        const t = await idb.getCopy.teamsPlus({
            stats: ["gp", "fg", "fga", "fgp"],
            tid: 4,
            season: g.season,
            statType: "totals",
        });

        assert.deepEqual(t, {
            stats: {
                gp: 10,
                fg: 50,
                fga: 100,
                fgp: 50,
                playoffs: false,
            },
        });
    });

    it("return playoff stats if playoffs is true", async () => {
        const t = await idb.getCopy.teamsPlus({
            stats: ["gp", "fg", "fga", "fgp"],
            tid: 4,
            season: g.season,
            playoffs: true,
            regularSeason: false,
        });

        assert.deepEqual(t, {
            stats: {
                gp: 4,
                fg: 3,
                fga: 30,
                fgp: 10,
                playoffs: true,
            },
        });
    });

    it("return stats in an array if no season is specified", async () => {
        idb.league = testHelpers.mockIDBLeague();
        const t = await idb.getCopy.teamsPlus({
            stats: ["gp", "fg", "fga", "fgp"],
            tid: 4,
            playoffs: true,
            regularSeason: false,
        });
        idb.league = undefined;

        assert.deepEqual(t, {
            stats: [
                {
                    gp: 4,
                    fg: 3,
                    fga: 30,
                    fgp: 10,
                    playoffs: true,
                },
            ],
        });
    });

    it("return stats in an array if regular season and playoffs are specified", async () => {
        idb.league = testHelpers.mockIDBLeague();
        const t = await idb.getCopy.teamsPlus({
            stats: ["gp", "fg", "fga", "fgp"],
            tid: 4,
            playoffs: true,
        });
        idb.league = undefined;

        assert.deepEqual(t, {
            stats: [
                {
                    gp: 10,
                    fg: 5,
                    fga: 10,
                    fgp: 50,
                    playoffs: false,
                },
                {
                    gp: 4,
                    fg: 3,
                    fga: 30,
                    fgp: 10,
                    playoffs: true,
                },
            ],
        });
    });
});
