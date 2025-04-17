import { assert, test } from "vitest";
import teamInfos from "./teamInfos.ts";
import geographicCoordinates from "./geographicCoordinates.ts";

test("every region in teamInfos has an entry in geographicCoordinates", () => {
	for (const { region } of Object.values(teamInfos)) {
		assert(geographicCoordinates[region]);
	}
});
