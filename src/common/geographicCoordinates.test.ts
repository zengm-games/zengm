import assert from "node:assert/strict";
import teamInfos from "./teamInfos";
import geographicCoordinates from "./geographicCoordinates";

describe("common/geographicCoordinates", () => {
	test("every region in teamInfos has an entry in geographicCoordinates", () => {
		for (const { region } of Object.values(teamInfos)) {
			assert(geographicCoordinates[region]);
		}
	});
});
