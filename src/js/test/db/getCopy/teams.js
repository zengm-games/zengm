import assert from 'assert';
import {Cache, connectMeta, idb} from '../../../db';
import {g} from '../../../common';
import {league, team} from '../../../core';

describe("db/getCopies", () => {
    describe("#teams()", () => {
        before(async () => {
            idb.meta = await connectMeta();
            await league.create("Test", 0, undefined, 2013, false);
            idb.cache = new Cache();
            await idb.cache.fill();

            let teamStats = await idb.cache.indexGet('teamStatsByPlayoffsTid', '0,4');
            teamStats.gp = 10;
            teamStats.fg = 50;
            teamStats.fga = 100;
            await idb.cache.put('teamStats', teamStats);

            teamStats = team.genStatsRow(4, true);
            teamStats.gp = 4;
            teamStats.fg = 12;
            teamStats.fga = 120;
            await idb.cache.add('teamStats', teamStats);
        });
        after(() => league.remove(g.lid));

        it("should return requested info if tid/season match", async () => {
            const t = await idb.getCopy.teamsPlus({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won", "payroll"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season,
            });

            assert(t.seasonAttrs.payroll > 0);
            assert.deepEqual(t, {
                tid: 4,
                abbrev: 'CIN',
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
        it("should return an array if no team ID is specified", async () => {
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
                abbrev: 'CIN',
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
        it("should return requested info if tid/season match, even when no attrs requested", async () => {
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
        it("should return requested info if tid/season match, even when no seasonAttrs requested", async () => {
            const t = await idb.getCopy.teamsPlus({
                attrs: ["tid", "abbrev"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season,
            });

            assert.deepEqual(t, {
                tid: 4,
                abbrev: 'CIN',
                stats: {
                    gp: 10,
                    fg: 5,
                    fgp: 50,
                    playoffs: false,
                },
            });
        });
        it("should return requested info if tid/season match, even when no stats requested", async () => {
            const t = await idb.getCopy.teamsPlus({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won"],
                tid: 4,
                season: g.season,
            });

            assert.deepEqual(t, {
                tid: 4,
                abbrev: 'CIN',
                seasonAttrs: {
                    season: g.season,
                    won: 0,
                },
            });
        });
        it("should return season totals if statType is 'totals'", async () => {
            const t = await idb.getCopy.teamsPlus({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                season: g.season,
                statType: 'totals',
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
        it("should return playoff stats if playoffs is true", async () => {
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
        it("should return stats in an array if no season is specified", async () => {
            const t = await idb.getCopy.teamsPlus({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                playoffs: true,
                regularSeason: false,
            });

            assert.deepEqual(t, {
                stats: [{
                    gp: 4,
                    fg: 3,
                    fga: 30,
                    fgp: 10,
                    playoffs: true,
                }],
            });
        });
        it("should return stats in an array if regular season and playoffs are specified", async () => {
            const t = await idb.getCopy.teamsPlus({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                playoffs: true,
            });

            assert.deepEqual(t, {
                stats: [{
                    gp: 10,
                    fg: 5,
                    fga: 10,
                    fgp: 50,
                    playoffs: false,
                }, {
                    gp: 4,
                    fg: 3,
                    fga: 30,
                    fgp: 10,
                    playoffs: true,
                }],
            });
        });
    });
});
