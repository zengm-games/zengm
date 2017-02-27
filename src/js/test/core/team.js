import assert from 'assert';
import {PLAYER} from '../../common';
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

    describe("#checkRosterSizes()", () => {
        before(async () => {
            await connectMeta();
            await league.create("Test", 0, undefined, 2013, false);
            g.cache = new Cache();
            await g.cache.fill();
        });
        after(() => league.remove(g.lid));

        const addTen = async (tid) => {
            const players = await g.cache.indexGetAll('playersByTid', PLAYER.FREE_AGENT);
            for (let i = 0; i < 10; i++) {
                players[i].tid = tid;
            }
            g.cache.markDirtyIndexes('players');
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
