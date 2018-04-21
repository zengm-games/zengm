import assert from "assert";
import { g, helpers as commonHelpers } from "../../../common";
import helpers from "../../helpers";
import { player } from "../../../worker/core";
import madeHof from "../../../worker/core/player/madeHof";

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

    describe("#getPlayerFakeAge()", () => {
        it("should pick appropriate player to have a fake age", () => {
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
            players[1].born.loc = "Ghana";

            players[2].pid = 2;
            players[2].born.loc = "USA";

            players[3].pid = 3;
            players[3].born.loc = "Egypt";

            const pidCounts = {
                0: 0,
                1: 0,
                2: 0,
                3: 0,
            };
            for (let i = 0; i < 1000; i++) {
                const p = player.getPlayerFakeAge(players);
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
