// @flow

import assert from "assert";
import range from "lodash/range";
import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player } from "..";
import { makeBrother, makeSon } from "./addRelatives";
import { idb } from "../../db";

const season = 2017;

const genFathers = () => {
    return range(season - 40, season - 20).map(season2 =>
        player.generate(PLAYER.RETIRED, 50, season2, true, 15.5),
    );
};

const genBrothers = () => {
    return range(season - 5, season + 1).map(season2 =>
        player.generate(0, 50, season2, true, 15.5),
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

    describe("makeBrother", () => {
        it("make player the brother of another player", async () => {
            await testHelpers.resetCache({
                players: [
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
                    ...genBrothers(),
                ],
            });

            const p = await idb.cache.players.get(0);
            p.born.loc = "Fake Country";
            await makeBrother(p);

            const brothers = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const brother = brothers.find(b => b.relatives.length > 0);
            if (!brother) {
                throw new Error("No brother found");
            }

            assert.equal(p.relatives.length, 1);
            assert.equal(p.relatives[0].type, "brother");
            assert.equal(p.relatives[0].pid, brother.pid);

            assert.equal(brother.relatives.length, 1);
            assert.equal(brother.relatives[0].type, "brother");
            assert.equal(brother.relatives[0].pid, p.pid);

            assert.equal(p.lastName, brother.lastName);
            assert.equal(p.born.loc, brother.born.loc);
        });

        it("skip player if no possible brother exists", async () => {
            await testHelpers.resetCache({
                players: [
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
                ],
            });

            const p = await idb.cache.players.get(0);
            await makeBrother(p);

            assert.equal(p.relatives.length, 0);
        });

        it("handle case where target has a father", async () => {
            const initialBrothers = genBrothers();
            for (const p of initialBrothers) {
                p.relatives.push({
                    type: "father",
                    pid: 1,
                    name: "Foo Bar",
                });
            }

            await testHelpers.resetCache({
                players: [
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
                    player.generate(
                        PLAYER.RETIRED,
                        50,
                        season - 30,
                        true,
                        15.5,
                    ), // Father
                    ...initialBrothers,
                ],
            });

            const p = await idb.cache.players.get(0);
            await makeBrother(p);

            const brothers = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const brother = brothers.find(b => b.relatives.length > 1);
            if (!brother) {
                throw new Error("No brother found");
            }

            assert.equal(p.relatives.length, 2);
            assert.equal(p.relatives[0].type, "father");
            assert.equal(p.relatives[0].pid, 1);
            assert.equal(p.relatives[1].type, "brother");
            assert.equal(p.relatives[1].pid, brother.pid);

            assert.equal(brother.relatives.length, 2);
            assert.equal(brother.relatives[0].type, "father");
            assert.equal(brother.relatives[0].pid, 1);
            assert.equal(brother.relatives[1].type, "brother");
            assert.equal(brother.relatives[1].pid, p.pid);
        });

        it("handle case where source has a father", async () => {
            const initialPlayer = player.generate(
                PLAYER.UNDRAFTED,
                20,
                season,
                true,
                15.5,
            );
            initialPlayer.relatives.push({
                type: "father",
                pid: 1,
                name: "Foo Bar",
            });

            await testHelpers.resetCache({
                players: [
                    initialPlayer,
                    player.generate(
                        PLAYER.RETIRED,
                        50,
                        season - 30,
                        true,
                        15.5,
                    ), // Father
                    ...genBrothers(),
                ],
            });

            const p = await idb.cache.players.get(0);
            await makeBrother(p);

            const brothers = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const brother = brothers.find(b => b.relatives.length > 1);
            if (!brother) {
                throw new Error("No brother found");
            }

            assert.equal(p.relatives.length, 2);
            assert.equal(p.relatives[0].type, "father");
            assert.equal(p.relatives[0].pid, 1);
            assert.equal(p.relatives[1].type, "brother");
            assert.equal(p.relatives[1].pid, brother.pid);

            assert.equal(brother.relatives.length, 2);
            assert.equal(brother.relatives[0].type, "father");
            assert.equal(brother.relatives[0].pid, 1);
            assert.equal(brother.relatives[1].type, "brother");
            assert.equal(brother.relatives[1].pid, p.pid);
        });

        it("handle case where both have fathers", async () => {
            const players = [
                player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),
                ...genBrothers(),
            ];
            for (const p of players) {
                p.relatives.push({
                    type: "father",
                    pid: 666,
                    name: "Foo Bar",
                });
            }

            await testHelpers.resetCache({
                players,
            });

            const p = await idb.cache.players.get(0);
            await makeBrother(p);

            const brothers = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const brother = brothers.find(b => b.relatives.length > 1);
            assert.equal(brother, undefined);
        });

        it("handle case where target has a brother", async () => {
            // This is weirdly incestuous, but make initialP the son of extraBrother so that extraBrother is never
            // picked as the brother for initialP, it is always one of initialBrothers. But then extraBrother will be
            // added to initialP's relatives as a brother, via already being a brother of one of initialBrothers. Ugh,
            // this is too confusing.
            const initialP = player.generate(
                PLAYER.UNDRAFTED,
                20,
                season,
                true,
                15.5,
            );
            initialP.relatives.push({
                type: "father",
                pid: 1,
                name: "Foo Bar",
            });

            const initialBrothers = genBrothers();
            for (const p of initialBrothers) {
                p.relatives.push({
                    type: "brother",
                    pid: 1,
                    name: "Foo Bar",
                });
            }

            await testHelpers.resetCache({
                players: [
                    initialP,
                    player.generate(PLAYER.RETIRED, 25, season - 5, true, 15.5), // Extra brother
                    ...initialBrothers,
                ],
            });

            const p = await idb.cache.players.get(0);
            await makeBrother(p);

            const brothers = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const brother = brothers.find(b => b.relatives.length > 1);
            if (!brother) {
                throw new Error("No brother found");
            }

            // The 0th entry of both p.relatives and brother.relatives is the father, extraBrother. See comment above.

            assert.equal(p.relatives.length, 3);
            assert.equal(p.relatives[1].type, "brother");
            assert.equal(p.relatives[1].pid, 1);
            assert.equal(p.relatives[2].type, "brother");
            assert.equal(p.relatives[2].pid, brother.pid);

            assert.equal(brother.relatives.length, 3);
            assert.equal(brother.relatives[1].type, "brother");
            assert.equal(brother.relatives[1].pid, 1);
            assert.equal(brother.relatives[2].type, "brother");
            assert.equal(brother.relatives[2].pid, p.pid);
        });

        it("handle case where source has a brother", async () => {
            const initialPlayer = player.generate(
                PLAYER.UNDRAFTED,
                20,
                season,
                true,
                15.5,
            );
            initialPlayer.relatives.push({
                type: "brother",
                pid: 1,
                name: "Foo Bar",
            });

            await testHelpers.resetCache({
                players: [
                    initialPlayer,
                    player.generate(PLAYER.RETIRED, 25, season - 5, true, 15.5), // Extra brother
                    ...genBrothers(),
                ],
            });

            const p = await idb.cache.players.get(0);
            await makeBrother(p);

            const brothers = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const brother = brothers.find(b => b.relatives.length > 1);
            assert.equal(brother, undefined);

            assert.equal(p.relatives.length, 1);
        });
    });

    describe("makeSon", () => {
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
            son.born.loc = "Fake Country";
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

            assert.equal(son.born.loc, father.born.loc);
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

        it("handle case where player already has a brother", async () => {
            await testHelpers.resetCache({
                players: [
                    // Son
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),

                    // Brother
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),

                    // Fathers
                    ...genFathers(),
                ],
            });

            const son = await idb.cache.players.get(0);
            son.relatives = [
                {
                    type: "brother",
                    pid: 1,
                    name: "Foo Bar",
                },
            ];
            await idb.cache.players.put(son);

            const brother = await idb.cache.players.get(1);
            brother.born.loc = "Fake Country";
            brother.relatives = [
                {
                    type: "brother",
                    pid: 0,
                    name: "Foo Bar",
                },
            ];
            await idb.cache.players.put(brother);

            await makeSon(son);

            const fathers = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.RETIRED,
            );
            const father = fathers.find(p => p.relatives.length > 0);
            if (!father) {
                throw new Error("No father found");
            }

            const son2 = await idb.cache.players.get(0);
            const brother2 = await idb.cache.players.get(1);

            assert.equal(son2.relatives.length, 2);
            assert.equal(son2.relatives[0].type, "father");
            assert.equal(son2.relatives[0].pid, father.pid);
            assert.equal(son2.relatives[1].type, "brother");
            assert.equal(son2.relatives[1].pid, brother2.pid);

            assert.equal(brother2.relatives.length, 2);
            assert.equal(brother2.relatives[0].type, "father");
            assert.equal(brother2.relatives[0].pid, father.pid);
            assert.equal(brother2.relatives[1].type, "brother");
            assert.equal(brother2.relatives[1].pid, son2.pid);

            assert.equal(father.relatives.length, 2);
            assert.equal(father.relatives[0].type, "son");
            assert.equal(father.relatives[1].type, "son");
            assert.deepEqual(
                father.relatives.map(relative => relative.pid).sort(),
                [0, 1],
            );

            assert.equal(brother2.born.loc, father.born.loc);
        });

        it("handle case where father already has a son", async () => {
            const initialFathers = genFathers();
            const initialOtherSons = initialFathers.map(() =>
                player.generate(0, 25, season, true, 15.5),
            );

            await testHelpers.resetCache({
                players: [
                    // Son
                    player.generate(PLAYER.UNDRAFTED, 20, season, true, 15.5),

                    // Other sons (one for each potential father)
                    ...initialOtherSons,

                    // Fathers
                    ...initialFathers,
                ],
            });

            const fathers = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.RETIRED,
            );
            const otherSons = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            assert.equal(fathers.length, otherSons.length);
            for (let i = 0; i < fathers.length; i++) {
                const father = fathers[i];
                const otherSon = otherSons[i];

                father.relatives.push({
                    type: "son",
                    pid: otherSon.pid,
                    name: `${otherSon.firstName} ${otherSon.lastName}`,
                });
                otherSon.relatives.push({
                    type: "father",
                    pid: father.pid,
                    name: `${father.firstName} ${father.lastName}`,
                });

                await idb.cache.players.put(father);
                await idb.cache.players.put(otherSon);
            }

            const son = await idb.cache.players.get(0);
            await makeSon(son);

            const fathers2 = await idb.cache.players.indexGetAll(
                "playersByTid",
                PLAYER.RETIRED,
            );
            const father = fathers2.find(p => p.relatives.length > 1);
            if (!father) {
                throw new Error("No father found");
            }

            const otherSons2 = await idb.cache.players.indexGetAll(
                "playersByTid",
                0,
            );
            const otherSon = otherSons2.find(p => p.relatives.length > 1);
            if (!otherSon) {
                throw new Error("No other son found");
            }

            const son2 = await idb.cache.players.get(0);

            assert.equal(son2.relatives.length, 2);
            assert.equal(son2.relatives[0].type, "father");
            assert.equal(son2.relatives[0].pid, father.pid);
            assert.equal(son2.relatives[1].type, "brother");
            assert.equal(son2.relatives[1].pid, otherSon.pid);

            assert.equal(otherSon.relatives.length, 2);
            assert.equal(otherSon.relatives[0].type, "father");
            assert.equal(otherSon.relatives[0].pid, father.pid);
            assert.equal(otherSon.relatives[1].type, "brother");
            assert.equal(otherSon.relatives[1].pid, son2.pid);

            assert.equal(father.relatives.length, 2);
            assert.equal(father.relatives[0].type, "son");
            assert.equal(father.relatives[1].type, "son");
            assert.deepEqual(
                father.relatives.map(relative => relative.pid).sort(),
                [son2.pid, otherSon.pid],
            );
        });
    });
});
