import assert from 'assert';
import {Cache, connectMeta} from '../../db';
import g from '../../globals';
import * as league from '../../core/league';
import * as player from '../../core/player';
import * as team from '../../core/team';

describe("core/team", () => {
    describe("#findStarters()", () => {
        it("should handle easy roster sorts", () => {
            let starters = team.findStarters(["PG", "SG", "SF", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters(["PG", "SG", "G", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters(["F", "SG", "SF", "PG", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters(["F", "SG", "SF", "PF", "G", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);
        });
        it("should put two Gs in starting lineup", () => {
            let starters = team.findStarters(["PG", "F", "SF", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 5]);

            starters = team.findStarters(["F", "PF", "G", "PF", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 5]);

            starters = team.findStarters(["F", "PF", "SF", "GF", "C", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 8]);

            starters = team.findStarters(["F", "PF", "SF", "C", "C", "F", "FC", "PF", "PG", "G"]);
            assert.deepEqual(starters, [0, 1, 2, 8, 9]);
        });
        it("should put two Fs (or one F and one C) in starting lineup", () => {
            let starters = team.findStarters(["PG", "SG", "G", "PF", "G", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 6]);

            starters = team.findStarters(["PG", "SG", "SG", "PG", "G", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 6, 7]);

            starters = team.findStarters(["PG", "SG", "SG", "PG", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 4, 6]);
        });
        it("should never put two pure Cs in starting lineup", () => {
            let starters = team.findStarters(["PG", "SG", "G", "C", "C", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 6]);

            starters = team.findStarters(["PG", "SG", "G", "C", "FC", "G", "F", "FC", "PF", "PG"]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);
        });
    });
    describe("#filter()", () => {
        before(async () => {
            await connectMeta();
            await league.create("Test", 0, undefined, 2013, false);
            g.cache = new Cache();
            await g.cache.fill();

            let teamStats = await g.dbl.teamStats.index('season, tid').get([g.season, 4]);
            teamStats.gp = 10;
            teamStats.fg = 50;
            teamStats.fga = 100;
            await g.dbl.teamStats.put(teamStats);

            teamStats = team.genStatsRow(4, true);
            teamStats.gp = 4;
            teamStats.fg = 12;
            teamStats.fga = 120;
            await g.dbl.teamStats.put(teamStats);
        });
        after(() => league.remove(g.lid));

        it("should return requested info if tid/season match", async () => {
            const t = await team.filter({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won", "payroll"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season,
            });
            assert.equal(t.tid, 4);
            assert.equal(t.abbrev, "CIN");
            assert.equal(t.season, g.season);
            assert.equal(t.won, 0);
            assert(t.payroll > 0);
            assert.equal(t.gp, 10);
            assert.equal(t.fg, 5);
            assert.equal(t.fgp, 50);
            assert.equal(Object.keys(t).length, 8);
            assert.equal(t.hasOwnProperty("stats"), false);
        });
        it("should return an array if no team ID is specified", async () => {
            const teams = await team.filter({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won"],
                stats: ["gp", "fg", "fgp"],
                season: g.season,
            });
            assert.equal(teams.length, g.numTeams);
            assert.equal(teams[4].tid, 4);
            assert.equal(teams[4].abbrev, "CIN");
            assert.equal(teams[4].season, g.season);
            assert.equal(teams[4].won, 0);
            assert.equal(teams[4].gp, 10);
            assert.equal(teams[4].fg, 5);
            assert.equal(teams[4].fgp, 50);
            assert.equal(Object.keys(teams[4]).length, 7);
            assert.equal(teams[4].hasOwnProperty("stats"), false);
        });
        it("should return requested info if tid/season match, even when no attrs requested", async () => {
            const t = await team.filter({
                seasonAttrs: ["season", "won"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season,
            });
            assert.equal(t.season, g.season);
            assert.equal(t.won, 0);
            assert.equal(t.gp, 10);
            assert.equal(t.fg, 5);
            assert.equal(t.fgp, 50);
            assert.equal(Object.keys(t).length, 5);
        });
        it("should return requested info if tid/season match, even when no seasonAttrs requested", async () => {
            const t = await team.filter({
                attrs: ["tid", "abbrev"],
                stats: ["gp", "fg", "fgp"],
                tid: 4,
                season: g.season,
            });
            assert.equal(t.tid, 4);
            assert.equal(t.abbrev, "CIN");
            assert.equal(t.gp, 10);
            assert.equal(t.fg, 5);
            assert.equal(t.fgp, 50);
            assert.equal(Object.keys(t).length, 5);
        });
        it("should return requested info if tid/season match, even when no stats requested", async () => {
            const t = await team.filter({
                attrs: ["tid", "abbrev"],
                seasonAttrs: ["season", "won"],
                tid: 4,
                season: g.season,
            });
            assert.equal(t.tid, 4);
            assert.equal(t.abbrev, "CIN");
            assert.equal(t.season, g.season);
            assert.equal(t.won, 0);
            assert.equal(Object.keys(t).length, 4);
        });
        it("should return season totals is options.totals is true", async () => {
            const t = await team.filter({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                season: g.season,
                totals: true,
            });
            assert.equal(t.gp, 10);
            assert.equal(t.fg, 50);
            assert.equal(t.fga, 100);
            assert.equal(t.fgp, 50);
        });
        it("should return playoff stats if options.playoffs is true", async () => {
            const t = await team.filter({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                season: g.season,
                playoffs: true,
            });
            assert.equal(t.gp, 4);
            assert.equal(t.fg, 3);
            assert.equal(t.fga, 30);
            assert.equal(t.fgp, 10);
        });
        it("should use supplied IndexedDB transaction", async () => {
            return g.dbl.tx(["players", "releasedPlayers", "teams", "teamSeasons"], async tx => {
                const t = await team.filter({
                    attrs: ["tid", "abbrev"],
                    seasonAttrs: ["season", "won"],
                    tid: 4,
                    season: g.season,
                    ot: tx,
                });
                assert.equal(t.tid, 4);
                assert.equal(t.abbrev, "CIN");
                assert.equal(t.season, g.season);
                assert.equal(t.won, 0);
                assert.equal(Object.keys(t).length, 4);

                // If another transaction was used inside team.filter besides tx, this will cause an error because the transaction will no longer be active
                return tx.players.get(0);
            });
        });
        it("should return stats in an array if no season is specified", async () => {
            const t = await team.filter({
                stats: ["gp", "fg", "fga", "fgp"],
                tid: 4,
                playoffs: true,
            });
            assert.equal(t.stats[0].gp, 4);
            assert.equal(t.stats[0].fg, 3);
            assert.equal(t.stats[0].fga, 30);
            assert.equal(t.stats[0].fgp, 10);
        });
    });

    describe("#checkRosterSizes()", () => {
        before(async () => {
            await connectMeta();
            await league.create("Test", 0, undefined, 2013, false);
            g.cache = new Cache();
            await g.cache.fill();
        });
        after(() => league.remove(g.lid));

        const addTen = async (tid) => {
            const players = await g.cache.indexGetAll('playersByTid', g.PLAYER.FREE_AGENT);
            for (let i = 0; i < 10; i++) {
                players[i].tid = tid;
            }
            g.cache.markDirtyIndex('players');
        };

        const removeTen = async (tid) => {
            const players = await g.cache.indexGetAll('playersByTid', tid);
            for (let i = 0; i < 10; i++) {
                await player.release(players[i], false);
            }
        };

        it("should add players to AI team under roster limit without returning error message", async () => {
            await removeTen(5);

            // Confirm roster size under limit
            let players = await g.cache.indexGetAll('playersByTid', 5);
            assert.equal(players.length, 4);
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(userTeamSizeError, null);

            // Confirm players added up to limit
            players = await g.cache.indexGetAll('playersByTid', 5);
            assert.equal(players.length, g.minRosterSize);
        });
        it("should remove players to AI team over roster limit without returning error message", async () => {
            await addTen(8);

            // Confirm roster size over limit
            let players = await g.cache.indexGetAll('playersByTid', 8);
            assert.equal(players.length, 24);

            // Confirm no error message and roster size pruned to limit
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(userTeamSizeError, null);
            players = await g.cache.indexGetAll('playersByTid', 8);
            assert.equal(players.length, 15);
        });
        it("should return error message when user team is under roster limit", async () => {
            await removeTen(g.userTid);

            // Confirm roster size under limit
            let players = await g.cache.indexGetAll('playersByTid', g.userTid);
            assert.equal(players.length, 4);

            // Confirm roster size error and no auto-signing of players
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(typeof userTeamSizeError, "string");
            assert(userTeamSizeError.includes('less'));
            assert(userTeamSizeError.includes('minimum'));
            players = await g.cache.indexGetAll('playersByTid', g.userTid);
            assert.equal(players.length, 4);
        });
        it("should return error message when user team is over roster limit", async () => {
            await addTen(g.userTid);
            await addTen(g.userTid);

            // Confirm roster size over limit
            let players = await g.cache.indexGetAll('playersByTid', g.userTid);
            assert.equal(players.length, 24);

            // Confirm roster size error and no auto-release of players
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(typeof userTeamSizeError, "string");
            assert(userTeamSizeError.includes('more'));
            assert(userTeamSizeError.includes('maximum'));
            players = await g.cache.indexGetAll('playersByTid', g.userTid);
            assert.equal(players.length, 24);
        });
    });
});
