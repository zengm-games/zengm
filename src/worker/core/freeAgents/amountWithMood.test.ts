import assert from "assert";
import amountWithMood from "./amountWithMood";
import testHelpers from "../../../test/helpers";
import { g } from "../../util";

describe("worker/core/freeAgents/amountWithMood", () => {
	beforeAll(() => {
		testHelpers.resetG(); // Two teams: user and AI

		g.setWithoutSavingToDB("minContract", 50);
		g.setWithoutSavingToDB("maxContract", 5000);
	});

	test("handles in units of thousands or millions", () => {
		const mood = 1.5;

		assert.equal(amountWithMood(5500, mood), 5000);
		assert.equal(amountWithMood(500, mood), 650);
		assert.equal(amountWithMood(50, mood), 50);

		assert.equal(amountWithMood(5.5, mood), 5);
		assert.equal(amountWithMood(0.5, mood), 0.65);
		assert.equal(amountWithMood(0.05, mood), 0.05);
	});
});
