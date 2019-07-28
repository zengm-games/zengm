// @flow

import assert from "assert";
import { player } from "../../../../deion/worker/core";
import madeHof from "./madeHof";

describe("worker/core/player/madeHof", () => {
    it("narrowly make HoF based on dominance factor", () => {
        const p = player.generate(0, 19, 2012, false, 15.5);
        p.stats = [
            {
                dws: 5,
                ows: 5,
                ewa: 10,
            },
            {
                dws: 5,
                ows: 5,
                ewa: 10,
            },
            {
                dws: 5,
                ows: 5,
                ewa: 10,
            },
            {
                dws: 7,
                ows: 7,
                ewa: 14,
            },
            {
                dws: 7,
                ows: 7,
                ewa: 14,
            },
            {
                dws: 7,
                ows: 7,
                ewa: 14,
            },
            {
                dws: 7,
                ows: 7,
                ewa: 14,
            },
            {
                dws: 7,
                ows: 7,
                ewa: 14,
            },
        ];

        assert.equal(madeHof(p), true);
    });

    it("narrowly miss HoF based on dominance factor", () => {
        const p = player.generate(0, 19, 2012, false, 15.5);
        p.stats = [
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
            {
                dws: 4,
                ows: 4,
                ewa: 8,
            },
        ];

        assert.equal(madeHof(p), false);
    });
});
