// @flow

import assert from "assert";
import { g } from "../../util";
import testHelpers from "../../../test/helpers";
import season from "./index";

describe("worker/core/season/genPlayoffSeries", () => {
    before(() => {
        testHelpers.resetG();
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
        g.numGamesPlayoffSeries = [7, 7];
        g.numPlayoffByes = 0;

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
        g.numGamesPlayoffSeries = [7, 7];
        g.numPlayoffByes = 0;

        const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

        assert.deepEqual(tidPlayoffs.sort(), [0, 2, 3, 6]);
        assert.equal(series[0].length, 2);
    });

    it("split teams by conference if there are two conferences, including byes", () => {
        const teams = [
            { tid: 0, cid: 0 },
            { tid: 2, cid: 0 },
            { tid: 3, cid: 0 },
            { tid: 6, cid: 0 },
            { tid: 5, cid: 1 },
            { tid: 1, cid: 1 },
            { tid: 4, cid: 1 },
            { tid: 7, cid: 1 },
        ];
        g.confs = [
            { cid: 0, name: "Eastern Conference" },
            { cid: 1, name: "Western Conference" },
        ];
        g.numGamesPlayoffSeries = [7, 7, 7];
        g.numPlayoffByes = 2;

        const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

        assert.deepEqual(tidPlayoffs.sort(), [0, 1, 2, 3, 4, 5]);

        const tids = [[0, undefined], [2, 3], [5, undefined], [1, 4]];
        assert.equal(series[0].length, tids.length);
        for (let i = 0; i < series[0].length; i++) {
            const { away, home } = series[0][i];

            assert.equal(tids[i][0], home.tid);
            if (away === undefined) {
                assert.equal(tids[i][1], undefined);
            } else {
                assert.equal(tids[i][1], away.tid);
            }
        }
    });

    it("pick teams regardless of conference if there are not two conferences, including byes", () => {
        const teams = [
            { tid: 0, cid: 0 },
            { tid: 2, cid: 0 },
            { tid: 3, cid: 2 },
            { tid: 6, cid: 0 },
            { tid: 5, cid: 1 },
            { tid: 1, cid: 1 },
            { tid: 4, cid: 1 },
            { tid: 7, cid: 1 },
        ];
        g.confs = [
            { cid: 0, name: "Eastern Conference" },
            { cid: 1, name: "Western Conference" },
            { cid: 2, name: "Whatever" },
        ];
        g.numGamesPlayoffSeries = [7, 7, 7];
        g.numPlayoffByes = 2;

        const { series, tidPlayoffs } = season.genPlayoffSeries(teams);

        assert.deepEqual(tidPlayoffs.sort(), [0, 1, 2, 3, 5, 6]);

        const tids = [[0, undefined], [6, 5], [3, 1], [2, undefined]];
        assert.equal(series[0].length, tids.length);
        for (let i = 0; i < series[0].length; i++) {
            const { away, home } = series[0][i];

            assert.equal(tids[i][0], home.tid);
            if (away === undefined) {
                assert.equal(tids[i][1], undefined);
            } else {
                assert.equal(tids[i][1], away.tid);
            }
        }
    });
});
