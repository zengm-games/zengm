// @flow

import assert from "assert";
import backboard from "backboard";
import { league } from "../worker/core";
import { connectMeta, idb } from "../worker/db";
import { g, local } from "../worker/util";

describe("Smoke Tests", () => {
    let intervalID;

    it("Create a new league and simuluate a season without error", async function() {
        this.timeout(5 * 60 * 1000); // 5 minutes

        idb.meta = await connectMeta({});
        await league.create("Test", 0, undefined, 2016, false, 0, {});

        local.autoPlaySeasons = 1;
        league.autoPlay();

        return new Promise(resolve => {
            intervalID = setInterval(() => {
                if (local.autoPlaySeasons === 0) {
                    clearInterval(intervalID);
                    // Wait to let it finish whatever DB activity might still be ongoing (like flushing cache)
                    setTimeout(resolve, 5000);
                }
            }, 500);
        });
    });

    after(async () => {
        clearInterval(intervalID);

        await league.remove(g.lid);
        assert.equal(g.lid, undefined);

        if (idb.meta !== undefined) {
            idb.meta.close();
        }
        await backboard.delete("meta");
        idb.meta = undefined;
    });
});
