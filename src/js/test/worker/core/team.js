import assert from "assert";
import { g, PLAYER } from "../../../common";
import helpers from "../../helpers";
import { league, player, team } from "../../../worker/core";
import { Cache, connectMeta, idb } from "../../../worker/db";

describe("core/team", () => {
    describe("#findStarters()", () => {
        it("should handle easy roster sorts", () => {
            let starters = team.findStarters([
                "PG",
                "SG",
                "SF",
                "PF",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters([
                "PG",
                "SG",
                "G",
                "PF",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters([
                "F",
                "SG",
                "SF",
                "PG",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);

            starters = team.findStarters([
                "F",
                "SG",
                "SF",
                "PF",
                "G",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);
        });
        it("should put two Gs in starting lineup", () => {
            let starters = team.findStarters([
                "PG",
                "F",
                "SF",
                "PF",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 5]);

            starters = team.findStarters([
                "F",
                "PF",
                "G",
                "PF",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 5]);

            starters = team.findStarters([
                "F",
                "PF",
                "SF",
                "GF",
                "C",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 8]);

            starters = team.findStarters([
                "F",
                "PF",
                "SF",
                "C",
                "C",
                "F",
                "FC",
                "PF",
                "PG",
                "G",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 8, 9]);
        });
        it("should put two Fs (or one F and one C) in starting lineup", () => {
            let starters = team.findStarters([
                "PG",
                "SG",
                "G",
                "PF",
                "G",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 6]);

            starters = team.findStarters([
                "PG",
                "SG",
                "SG",
                "PG",
                "G",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 6, 7]);

            starters = team.findStarters([
                "PG",
                "SG",
                "SG",
                "PG",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 4, 6]);
        });
        it("should never put two pure Cs in starting lineup", () => {
            let starters = team.findStarters([
                "PG",
                "SG",
                "G",
                "C",
                "C",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 6]);

            starters = team.findStarters([
                "PG",
                "SG",
                "G",
                "C",
                "FC",
                "G",
                "F",
                "FC",
                "PF",
                "PG",
            ]);
            assert.deepEqual(starters, [0, 1, 2, 3, 4]);
        });
    });

    describe("#checkRosterSizes()", () => {
        before(async () => {
            helpers.resetG();

            // Two teams: user and AI
            g.numTeams = 2;
        });

        // resetCacheWithPlayers({0: 10, 1: 9, [PLAYER.FREE_AGENT]: 1}) will make 10 players on team 0, 9 on team 1, and
        // 1 free agent with a minimum contract.
        const resetCacheWithPlayers = async (info: {
            [key: number]: number,
        }) => {
            const players = [];
            for (let tid of Object.keys(info)) {
                tid = parseInt(tid, 10);
                for (let i = 0; i < info[tid]; i++) {
                    const p = player.generate(
                        tid,
                        30,
                        50,
                        2017,
                        true,
                        15.5,
                    );
                    if (tid === PLAYER.FREE_AGENT) {
                        p.contract.amount = g.minContract;
                    }
                    players.push(p);
                }
            }

            await helpers.resetCache({
                players,
            });
        };

        it("should add players to AI team under roster limit without returning error message", async () => {
            await resetCacheWithPlayers({
                0: 10,
                1: 9,
                [PLAYER.FREE_AGENT]: 1,
            });

            // Confirm roster size under limit
            let players = await idb.cache.players.indexGetAll(
                "playersByTid",
                1,
            );
            assert.equal(players.length, 9);
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(userTeamSizeError, undefined);

            // Confirm players added up to limit
            players = await idb.cache.players.indexGetAll("playersByTid", 1);
            assert.equal(players.length, g.minRosterSize);
        });
        it("should return error message when AI team needs to add a player but there is none", async () => {
            await resetCacheWithPlayers({ 0: 10, 1: 9 });

            // Confirm roster size under limit
            const teamSizeError = await team.checkRosterSizes();
            assert.equal(
                teamSizeError,
                "AI team BAL needs to add a player to meet the minimum roster requirements, but there are not enough free agents asking for a minimum salary. Easiest way to fix this is God Mode, give them extra players.",
            );
        });
        it("should remove players to AI team over roster limit without returning error message", async () => {
            await resetCacheWithPlayers({ 0: 10, 1: 24 });

            // Confirm roster size over limit
            let players = await idb.cache.players.indexGetAll(
                "playersByTid",
                1,
            );
            assert.equal(players.length, 24);

            // Confirm no error message and roster size pruned to limit
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(userTeamSizeError, undefined);
            players = await idb.cache.players.indexGetAll("playersByTid", 1);
            assert.equal(players.length, 15);
        });
        it("should return error message when user team is under roster limit", async () => {
            await resetCacheWithPlayers({
                0: 9,
                1: 10,
                [PLAYER.FREE_AGENT]: 1,
            });

            // Confirm roster size under limit
            let players = await idb.cache.players.indexGetAll(
                "playersByTid",
                g.userTid,
            );
            assert.equal(players.length, 9);

            // Confirm roster size error and no auto-signing of players
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(typeof userTeamSizeError, "string");
            assert(userTeamSizeError.includes("less"));
            assert(userTeamSizeError.includes("minimum"));
            players = await idb.cache.players.indexGetAll(
                "playersByTid",
                g.userTid,
            );
            assert.equal(players.length, 9);
        });
        it("should return error message when user team is over roster limit", async () => {
            await resetCacheWithPlayers({ 0: 24, 1: 10 });

            // Confirm roster size over limit
            let players = await idb.cache.players.indexGetAll(
                "playersByTid",
                g.userTid,
            );
            assert.equal(players.length, 24);

            // Confirm roster size error and no auto-release of players
            const userTeamSizeError = await team.checkRosterSizes();
            assert.equal(typeof userTeamSizeError, "string");
            assert(userTeamSizeError.includes("more"));
            assert(userTeamSizeError.includes("maximum"));
            players = await idb.cache.players.indexGetAll(
                "playersByTid",
                g.userTid,
            );
            assert.equal(players.length, 24);
        });
    });
});
