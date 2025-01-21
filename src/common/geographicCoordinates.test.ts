import { assert, test } from "vitest";
import teamInfos from "./teamInfos";
import geographicCoordinates from "./geographicCoordinates";

test("every region in teamInfos has an entry in geographicCoordinates", () => {
	for (const { region } of Object.values(teamInfos)) {
		assert(geographicCoordinates[region]);
	}
});
