// @flow

import assert from "assert";
import range from "lodash/range";
import { after, before, describe, it } from "mocha";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player } from "..";
import { makeSon } from "./addRelatives";
import { idb } from "../../db";

const season = 2017;

const genFathers = () => {
    return range(season - 40, season - 16).map(season2 =>
        player.generate(PLAYER.RETIRED, 50, season2, true, 15.5),
    );
};

describe("worker/core/player/addRelatives", () => {
    before(() => {
        testHelpers.resetG();
        idb.league = testHelpers.mockIDBLeague();
    });

    after(() => {
        idb.league = undefined;
    });

    describe.only("makeSon", () => {
        it("make player the son of another player", async () => {
            await testHelpers.resetCache({
                players: [
                    // Son
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),

                    // Fathers
                    ...genFathers(),
                ],
            });

            const son = await idb.cache.players.get(0);
            await makeSon(son);

            const fathers = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.RETIRED,
            );
            const father = fathers.find(p => p.relatives.length > 0);
            if (!father) {
                throw new Error("No father found");
            }

            assert.equal(son.relatives.length, 1);
            assert.equal(son.relatives[0].type, "father");
            assert.equal(son.relatives[0].pid, father.pid);

            assert.equal(father.relatives.length, 1);
            assert.equal(father.relatives[0].type, "son");
            assert.equal(father.relatives[0].pid, son.pid);
        });

        it("skip player if no possible father exists", async () => {
            await testHelpers.resetCache({
                players: [
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
                ],
            });

            const son = await idb.cache.players.get(0);
            await makeSon(son);

            assert.equal(son.relatives.length, 0);
        });

        it("skip player if he already has a father", async () => {
            await testHelpers.resetCache({
                players: [
                    // Son
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),

                    // Fathers
                    ...genFathers(),
                ],
            });

            const relFather = {
                type: "father",
                pid: 1,
                name: "Foo Bar",
            };

            const son = await idb.cache.players.get(0);
            son.relatives = [relFather];
            await makeSon(son);

            const fathers = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.RETIRED,
            );
            const father = fathers.find(p => p.relatives.length > 0);
            assert(!father);

            assert.equal(son.relatives.length, 1);
            assert.deepEqual(son.relatives[0], relFather);
        });

        it("handle case where player already has a brother");

        it("handle case where father already has a son");
    });

    describe("makeBrother", () => {
        it("make player the brother of another player");

        it("skip player if no possible brother exists");

        it("handle case where target has a father");

        it("handle case where source has a father");

        it("handle case where both have fathers");

        it("handle case where target has a brother");

        it("handle case where source has a brother");
    });
});
