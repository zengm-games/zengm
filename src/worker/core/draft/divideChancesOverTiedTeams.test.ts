import { assert, beforeAll, test } from "vitest";
import divideChancesOverTiedTeams from "./divideChancesOverTiedTeams.ts";
import { resetG } from "../../../test/helpers.ts";

beforeAll(() => {
	resetG();
});

const getChances = () => [
	250, 199, 156, 119, 88, 63, 43, 28, 17, 11, 8, 7, 6, 5,
];

// Sorted worst first, like going into the lottery. Indexes 6-8 and 10-12 are tied.
const teams = [
	0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.4, 0.4, 0.45, 0.5, 0.5, 0.5, 0.55,
	0.6, 0.7,
].map((winp) => ({
	seasonAttrs: {
		pts: 0,
		winp,
	},
}));

test("tied teams split their combined chances evenly", () => {
	const chances = getChances();
	divideChancesOverTiedTeams(chances, teams, false);

	assert.deepStrictEqual(chances, [
		250,
		199,
		156,
		119,
		88,
		63,
		88 / 3,
		88 / 3,
		88 / 3,
		11,
		7,
		7,
		7,
		5,
	]);
});

test("when isFinal is true, the remainder goes to the first tied teams", () => {
	const chances = getChances();
	divideChancesOverTiedTeams(chances, teams, true);

	assert.deepStrictEqual(
		chances,
		[250, 199, 156, 119, 88, 63, 30, 29, 29, 11, 7, 7, 7, 5],
	);
});
