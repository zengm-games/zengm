// @flow

import assert from "assert";
import testHelpers from "../../../test/helpers";
import lotterySort from "./lotterySort";
import { g } from "../../util";

describe("worker/core/draft/lotterySort", () => {
    it("projects playoff appearances when sorting for a projected lottery", async () => {
        testHelpers.resetG();
        g.numGamesPlayoffSeries = [7];

        // Two top teams are in the same conference. Only one will make the playoffs.
        const teams = [
            {
                tid: 0,
                cid: 0,
                seasonAttrs: {
                    winp: 0.9,
                    playoffRoundsWon: -1,
                    won: 9,
                    lost: 1,
                },
            },
            {
                tid: 1,
                cid: 0,
                seasonAttrs: {
                    winp: 0.8,
                    playoffRoundsWon: -1,
                    won: 8,
                    lost: 2,
                },
            },
            {
                tid: 2,
                cid: 1,
                seasonAttrs: {
                    winp: 0.1,
                    playoffRoundsWon: -1,
                    won: 1,
                    lost: 9,
                },
            },
            {
                tid: 3,
                cid: 1,
                seasonAttrs: {
                    winp: 0.2,
                    playoffRoundsWon: -1,
                    won: 2,
                    lost: 8,
                },
            },
        ];

        lotterySort(teams);

        assert.deepEqual(teams.map(t => t.tid), [2, 1, 3, 0]);
    });
});
