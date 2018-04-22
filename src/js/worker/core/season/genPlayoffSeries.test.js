// @flow

import assert from "assert";
import { after, before, describe, it } from "mocha";
import { g } from "../../../common";
import testHelpers from "../../../test/helpers";
import season from "./index";

describe("worker/core/season/genPlayoffSeries", () => {
    before(() => {
        testHelpers.resetG();
        g.numPlayoffRounds = 2;
    });

    after(() => {
        testHelpers.resetG();
    });

    it("split teams by conference if there are two conferences", () => {
        const teams = [
            { tid: 0, cid: 0 },
            { tid: 2, cid: 0 },
            { tid: 3, cid: 0 },
            { tid: 6, cid: 0 },
            { tid: 5, cid: 1 },
            { tid: 1, cid: 1 },
            { tid: 4, cid: 1 },
        ];
        g.confs = [
            { cid: 0, name: "Eastern Conference" },
            { cid: 1, name: "Western Conference" },
        ];

        const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

        assert.deepEqual(tidPlayoffs.sort(), [0, 1, 2, 5]);
        assert.equal(series[0].length, 2);
    });

    it("pick teams regardless of conference if there are not two conferences", () => {
        const teams = [
            { tid: 0, cid: 0 },
            { tid: 2, cid: 0 },
            { tid: 3, cid: 2 },
            { tid: 6, cid: 0 },
            { tid: 5, cid: 1 },
            { tid: 1, cid: 1 },
            { tid: 4, cid: 1 },
        ];
        g.confs = [
            { cid: 0, name: "Eastern Conference" },
            { cid: 1, name: "Western Conference" },
            { cid: 2, name: "Whatever" },
        ];

        const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

        assert.deepEqual(tidPlayoffs.sort(), [0, 2, 3, 6]);
        assert.equal(series[0].length, 2);
    });
});
