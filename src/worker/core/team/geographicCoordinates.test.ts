import assert from "node:assert/strict";
import teamInfos from "../../../common/teamInfos";
import geographicCoordinates from "./geographicCoordinates";

describe("worker/core/team/geographicCoordinates", () => {
	test("every region in teamInfos has an entry in geographicCoordinates", () => {
		for (const { region } of Object.values(teamInfos)) {
			assert(geographicCoordinates[region]);
		}
	});
});
