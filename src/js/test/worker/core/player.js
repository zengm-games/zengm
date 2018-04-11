import assert from "assert";
import { g, helpers as commonHelpers } from "../../../common";
import helpers from "../../helpers";
import { player } from "../../../worker/core";

// Default values needed
g.teamAbbrevsCache = commonHelpers.getTeamsDefault().map(t => t.abbrev);
g.numTeams = 30;
g.userTids = [0];

describe("core/player", () => {
    describe("#generate()", () => {
        it("should create player with no stats", () => {
            const p = player.generate(-2, 19, 2012, false, 15.5);
            assert.equal(p.stats.length, 0);
        });
    });

    describe("#madeHof()", () => {
        it("should correctly assign players to the Hall of Fame", () => {
            // Like player from http://www.reddit.com/r/BasketballGM/comments/222k8b/so_a_10x_dpoy_apparently_doesnt_have_what_it/
            const p = player.generate(0, 19, 2012, false, 15.5);
            p.stats = [
                {
                    min: 1 * 2.6,
                    per: 18.7,
                    ewa: 0,
                },
                {
                    min: 77 * 19.3,
                    per: 13,
                    ewa: 1.1,
                },
                {
                    min: 82 * 26,
                    per: 18.9,
                    ewa: 6.6,
                },
                {
                    min: 82 * 33.9,
                    per: 15.3,
                    ewa: 4.7,
                },
                {
                    min: 79 * 33.8,
                    per: 16,
                    ewa: 5.3,
                },
                {
                    min: 81 * 31,
                    per: 17.1,
                    ewa: 6.1,
                },
                {
                    min: 80 * 28,
                    per: 16.2,
                    ewa: 4.6,
                },
                {
                    min: 82 * 34.1,
                    per: 16.6,
                    ewa: 6.2,
                },
                {
                    min: 80 * 34.8,
                    per: 16.9,
                    ewa: 6.5,
                },
                {
                    min: 82 * 31.7,
                    per: 17.8,
                    ewa: 7,
                },
                {
                    min: 81 * 33.5,
                    per: 18.8,
                    ewa: 8.3,
                },
                {
                    min: 82 * 32,
                    per: 17.8,
                    ewa: 7,
                },
                {
                    min: 82 * 30.5,
                    per: 17,
                    ewa: 5.9,
                },
                {
                    min: 76 * 30.6,
                    per: 16.3,
                    ewa: 4.8,
                },
                {
                    min: 82 * 30.8,
                    per: 16,
                    ewa: 5,
                },
                {
                    min: 82 * 28,
                    per: 15.6,
                    ewa: 4.1,
                },
            ];

            assert.equal(player.madeHof(p), false);
        });
    });

    describe("#getPlayerFakeAge()", () => {
        it("should pick appropriate player to have a fake age", async () => {
            helpers.resetG();

            const players = [
                player.generate(0, 19, g.season, false, 15.5),
                player.generate(0, 25, g.season, false, 15.5), // Should get filtered out, too old
                player.generate(0, 22, g.season, false, 15.5),
                player.generate(0, 20, g.season, false, 15.5),
            ];
            players[0].pid = 0;
            players[0].born.loc = "Ghana";

            players[1].pid = 1;

            players[2].pid = 2;
            players[1].born.loc = "USA";

            players[3].pid = 3;
            players[3].born.loc = "Egypt";

            const pidCounts = {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
            };
            for (let i = 0; i < 1000; i++) {
                const p = await player.getPlayerFakeAge(players);
                assert(p !== undefined);
                pidCounts[p.pid] += 1;
            }

            // 40/81
            assert(
                pidCounts[0] >= 100,
                `Player 0 picked ${
                    pidCounts[0]
                } times, should be more than 100`,
            );
            // 1/81
            assert.equal(pidCounts[1], 0);
            // 0/81
            assert(
                pidCounts[2] > 0 && pidCounts[2] < 100,
                `Player 2 picked ${
                    pidCounts[2]
                } times, should be between 0 and 100`,
            );
            // 40/81
            assert(
                pidCounts[3] >= 100,
                `Player 3 picked ${
                    pidCounts[3]
                } times, should be more than 100`,
            );
        });
    });
});
