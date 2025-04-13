import { afterEach, assert, beforeAll, test } from "vitest";
import { g } from "../../util/index.ts";
import { trade } from "../index.ts";
import { beforeTests, reset } from "./testHelpers.ts";
import get from "./get.ts";

const testCreateTrade = async (
	otherTidTest: number,
	userPidsTest: number[],
	otherPidsTest: number[],
) => {
	const { teams } = await get();
	assert.deepStrictEqual(teams[1].tid, otherTidTest);
	assert.deepStrictEqual(teams[0].pids, userPidsTest);
	assert.deepStrictEqual(teams[1].pids, otherPidsTest);
};

beforeAll(beforeTests);
afterEach(reset);

test("create trade with team ID", async () => {
	await trade.create([
		{
			tid: g.get("userTid"),
			pids: [],
			pidsExcluded: [],
			dpids: [],
			dpidsExcluded: [],
		},
		{
			tid: 1,
			pids: [],
			pidsExcluded: [],
			dpids: [],
			dpidsExcluded: [],
		},
	]);
	await testCreateTrade(1, [], []);
});

test("create trade with player ID", async () => {
	await trade.create([
		{
			tid: g.get("userTid"),
			pids: [],
			pidsExcluded: [],
			dpids: [],
			dpidsExcluded: [],
		},
		{
			tid: 2,
			pids: [2],
			pidsExcluded: [],
			dpids: [],
			dpidsExcluded: [],
		},
	]);
	await testCreateTrade(2, [], [2]);
});
