// @flow

import assert from "assert";
import penalties from "./penalties";

describe("worker/core/GameSim", () => {
    describe("penalties", () => {
        it("posOdds sum to 1", () => {
            for (const pen of penalties) {
                if (!pen.posOdds || Object.keys(pen.posOdds).length === 0) {
                    continue;
                }
                // $FlowFixMe
                const sumOdds = Object.values(pen.posOdds).reduce(
                    // $FlowFixMe
                    (sum, val) => sum + val,
                    0,
                );
                assert(
                    sumOdds > 0.999 && sumOdds < 1.001,
                    `Sum of posOdds should be 1 but is ${sumOdds} for ${pen.name} (${pen.side})`,
                );
            }
        });
    });
});
