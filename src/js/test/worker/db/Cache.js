import assert from "assert";
import { g } from "../../../common";
import helpers from "../../helpers";
import { player } from "../../../worker/core";
import { idb } from "../../../worker/db";

describe("db/Cache", () => {
    before(async () => {
        helpers.resetG();

        await helpers.resetCache({
            players: [player.generate(g.userTid, 30, 2017, true, 15.5)],
        });
    });
    beforeEach(() => {
        idb.cache._status = "full";
    });

    describe("#get()", () => {
        it("should retrieve an object", async () => {
            const p = (await idb.cache.players.getAll())[0];
            const p2 = await idb.cache.players.get(p.pid);
            assert.equal(p.pid, p2.pid);
        });
        it("should return undefined for invalid ID", async () => {
            const p = await idb.cache.players.get(-1);
            assert.equal(typeof p, "undefined");
        });

        for (const status of ["filling", "flushing"]) {
            it(`should wait until ${status} complete before resolving query`, async () => {
                const p = (await idb.cache.players.getAll())[0];

                idb.cache._status = status;
                let setTimeoutCalled = false;
                setTimeout(() => {
                    setTimeoutCalled = true;
                    idb.cache._setStatus("full");
                }, 1000);

                const p2 = await idb.cache.players.get(p.pid);
                assert(setTimeoutCalled);
                assert.equal(idb.cache._status, "full");
                assert.equal(p.pid, p2.pid);
            });
        }
    });
});
