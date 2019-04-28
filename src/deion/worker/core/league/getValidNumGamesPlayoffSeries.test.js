// @flow

import assert from "assert";
import getValidNumGamesPlayoffSeries from "./getValidNumGamesPlayoffSeries";

describe("worker/core/league/getValidNumGamesPlayoffSeries", () => {
    it("handles normal case", async () => {
        const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
            [5, 7, 7, 7],
            undefined,
            30,
        );
        assert.deepEqual(numGamesPlayoffSeries, [5, 7, 7, 7]);
    });

    it("handles lengthening playoffs when numPlayoffRounds is set", async () => {
        const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
            [3, 5],
            3,
            30,
        );
        assert.deepEqual(numGamesPlayoffSeries, [3, 5, 5]);
    });

    it("handles truncating playoffs when numPlayoffRounds is set", async () => {
        const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
            [5, 7],
            1,
            30,
        );
        assert.deepEqual(numGamesPlayoffSeries, [5]);
    });

    it("handles truncating playoffs if not enough teams", async () => {
        const numGamesPlayoffSeries = getValidNumGamesPlayoffSeries(
            [5, 7, 7, 7],
            undefined,
            7,
        );
        assert.deepEqual(numGamesPlayoffSeries, [5, 7]);
    });
});
