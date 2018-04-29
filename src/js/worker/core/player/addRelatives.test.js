// @flow

import { describe, it } from "mocha";

describe("worker/core/player/addRelatives", () => {
    describe("makeSon", () => {
        it("make player the son of another player");

        it("skip player if no possible father exists");

        it("skip player if he already has a father");

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
