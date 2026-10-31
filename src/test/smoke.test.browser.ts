import { afterAll, describe, test } from "vitest";
import { cleanup, createAndSim } from "./smoke-helpers.ts";

describe("Smoke Tests", () => {
	test(
		"Create a new league and simuluate a season without error",
		{
			timeout: 10 * 60 * 1000, // 10 minutes
		},
		async () => {
			await createAndSim();
		},
	);

	afterAll(cleanup);
});
