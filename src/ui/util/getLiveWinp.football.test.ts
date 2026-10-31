import { assert, test } from "vitest";
import { getLiveWinp } from "./getLiveWinp.ts";

test("a level score at the end of regulation stays even", () => {
	const result = getLiveWinp({
		boxScore: {
			numPeriods: 4,
			teams: [0, 1].map((tid) => ({
				ovr: 60 - tid,
				pts: 21,
				ptsQtrs: [7, 7, 7, 0],
				tid,
			})),
			time: "0:00",
		},
		homeCourtAdvantage: 1,
		quarterLength: 15,
		sportState: { plays: [] },
	});
	assert.strictEqual(result?.prob, 0.5);
});
