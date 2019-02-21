// @flow

import assert from "assert";
import { helpers } from ".";

describe("ui/util/helpers", () => {
    describe("numberWithCommas", () => {
        it("work", () => {
            assert.equal(helpers.numberWithCommas(5823795234), "5,823,795,234");
            assert.equal(helpers.numberWithCommas(582.3795234), "582");
            assert.equal(
                helpers.numberWithCommas("5823795234"),
                "5,823,795,234",
            );
            assert.equal(helpers.numberWithCommas("582.3795234"), "582");
        });
    });
});
