// @flow

import assert from "assert";
import backboard from "backboard";
import { describe, it } from "mocha";
import { g } from "../../../common";
import { connectMeta, idb } from "../../db";
import league from "./index";

describe("worker/core/league/remove", () => {
    it("remove league database", async () => {
        idb.meta = await connectMeta({});
        await league.create("Test", 0, undefined, 2013, false, {});

        await league.remove(g.lid);

        assert.equal(g.lid, undefined);

        if (idb.meta !== undefined) {
            idb.meta.close();
        }
        await backboard.delete("meta");
        idb.meta = undefined;
    });
});
