import { afterAll, describe, test } from "vitest";
import { cleanup, createAndSim } from "./smoke-helpers.ts";

describe("Smoke Tests", () => {
	test(
		"Create a new league and simuluate a season without error",
		{
			timeout: 100 * 60 * 1000, // 100 minutes
		},
		async ({ bench }) => {
			await bench("sim", async () => {
				await createAndSim();
			}).run();
		},
	);

	afterAll(cleanup);
});
