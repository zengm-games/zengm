// @flow

import assert from "assert";
import player from "./index";

describe("worker/core/player/generate", () => {
    it("create player with no stats", () => {
        const p = player.generate(-2, 19, 2012, false, 15.5);
        assert.equal(p.stats.length, 0);
    });
});
