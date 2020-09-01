import assert from "assert";
import { trade } from "..";
import { g } from "../../util";
import { beforeTests, reset } from "./testHelpers";
import get from "./get";

describe("worker/core/trade/updatePlayers", () => {
	beforeAll(beforeTests);
	afterEach(reset);

	test("allow players from both teams to be set", async () => {
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
		const userPidsTest = [0, 1];
		const otherPidsTest = [2, 3];
		const teams = await trade.updatePlayers([
			{
				tid: g.get("userTid"),
				pids: userPidsTest,
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: 1,
				pids: otherPidsTest,
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		]);
		assert.deepStrictEqual(teams[0].pids, userPidsTest);
		assert.deepStrictEqual(teams[1].pids, otherPidsTest);
	});

	test("filter out invalid players", async () => {
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
		const teams = await trade.updatePlayers([
			{
				tid: g.get("userTid"),
				pids: [1, 16, 20, 48, 50, 90],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: 1,
				pids: [12, 63, 3, 87, 97, 524],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		]);
		assert.deepStrictEqual(teams[0].pids, [1]);
		assert.deepStrictEqual(teams[1].pids, [3]);
	});

	test("delete the other team's players, but not the user's players, from the trade when a new team is selected", async () => {
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
		const userPidsTest = [0, 1];
		const otherPidsTest = [2, 3];
		let teams = await trade.updatePlayers([
			{
				tid: g.get("userTid"),
				pids: userPidsTest,
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
			{
				tid: 1,
				pids: otherPidsTest,
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		]);
		assert.deepStrictEqual(teams[0].pids, userPidsTest);
		assert.deepStrictEqual(teams[1].pids, otherPidsTest);
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
				pids: [],
				pidsExcluded: [],
				dpids: [],
				dpidsExcluded: [],
			},
		]);
		const tr = await get();
		teams = tr.teams;
		assert.deepStrictEqual(teams[0].pids, userPidsTest);
		assert.deepStrictEqual(teams[1].pids, []);
	});
});
