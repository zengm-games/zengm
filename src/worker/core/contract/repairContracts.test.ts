import { assert, beforeEach, describe, test } from "vitest";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import type { Contract, FlatContractInfo } from "../../../common/types.ts";
import { resetG } from "../../../test/helpers.ts";
import { g } from "../../util/index.ts";
import { repairContracts } from "./repairContracts.ts";

const contract = (start: number, amounts: number[]): Contract => ({
	type: "unknown",
	start,
	amounts,
	payments: [],
});

const makePlayer = ({
	contractDemand,
	contracts = [],
	owedByTids,
	tid,
}: {
	contractDemand?: FlatContractInfo;
	contracts?: Contract[];
	owedByTids?: number[];
	tid: number;
}) => ({ contractDemand, contracts, owedByTids, tid });

describe("repairContracts", () => {
	beforeEach(() => {
		resetG();
		g.setWithoutSavingToDB("minContract", 750);
		g.setWithoutSavingToDB("season", 2026);
		g.setWithoutSavingToDB("phase", PHASE.REGULAR_SEASON);
	});

	test("player on a team with a contract is not changed", () => {
		const p = makePlayer({ tid: 3, contracts: [contract(2025, [1000, 1000])] });
		assert.deepStrictEqual(repairContracts(p), []);
		assert.strictEqual(p.contractDemand, undefined);
	});

	test("player on a team with a contract and a contract demand loses the contract demand", () => {
		const p = makePlayer({
			tid: 3,
			contracts: [contract(2026, [1000, 1000])],
			contractDemand: { amount: 2000, exp: 2027 },
		});
		assert.strictEqual(repairContracts(p).length, 1);
		assert.strictEqual(p.contractDemand, undefined);
	});

	test("player on a team whose contract ended before this season gets a contract demand", () => {
		const p = makePlayer({ tid: 3, contracts: [contract(2023, [1000, 1000])] });
		assert.strictEqual(repairContracts(p).length, 1);
		assert.deepStrictEqual(p.contractDemand, { amount: 750, exp: 2026 });
	});

	test("unsigned draft pick keeps his contract demand", () => {
		const p = makePlayer({
			tid: 3,
			contractDemand: { amount: 1000, exp: 2026 },
		});
		assert.deepStrictEqual(repairContracts(p), []);
		assert.deepStrictEqual(p.contractDemand, { amount: 1000, exp: 2026 });
	});

	test("free agent without a contract demand gets one", () => {
		const p = makePlayer({
			tid: PLAYER.FREE_AGENT,
			contracts: [contract(2024, [1000, 1000])],
		});
		assert.strictEqual(repairContracts(p).length, 1);
		assert.deepStrictEqual(p.contractDemand, { amount: 750, exp: 2026 });
	});

	test("free agent's unfinished contract ends", () => {
		const p = makePlayer({
			tid: PLAYER.FREE_AGENT,
			contracts: [contract(2026, [1000, 1000])],
			contractDemand: { amount: 1000, exp: 2027 },
		});
		assert.strictEqual(repairContracts(p).length, 1);
		assert.deepStrictEqual(p.contracts[0]!.endedEarly, {
			season: 2026,
			phase: PHASE.REGULAR_SEASON,
		});
	});

	test("free agent's expiring contract after the regular season is already paid", () => {
		const p = makePlayer({
			tid: PLAYER.FREE_AGENT,
			contracts: [contract(2025, [1000, 1000])],
			contractDemand: { amount: 1000, exp: 2027 },
		});
		g.setWithoutSavingToDB("phase", PHASE.DRAFT);
		assert.deepStrictEqual(repairContracts(p), []);
		assert.strictEqual(p.contracts[0]!.endedEarly, undefined);
	});

	test("in a fantasy draft, a player who was on a team keeps his contract", () => {
		const p = makePlayer({
			tid: PLAYER.UNDRAFTED,
			contracts: [contract(2026, [1000, 1000])],
		});
		g.setWithoutSavingToDB("phase", PHASE.FANTASY_DRAFT);
		assert.deepStrictEqual(repairContracts(p), []);
		assert.strictEqual(p.contractDemand, undefined);
	});

	test("outside of a fantasy draft, a draft prospect needs a contract demand", () => {
		const p = makePlayer({
			tid: PLAYER.UNDRAFTED,
			contracts: [contract(2024, [1000, 1000])],
		});
		assert.strictEqual(repairContracts(p).length, 1);
		assert.deepStrictEqual(p.contractDemand, { amount: 750, exp: 2026 });
	});

	test("retired player loses his contract demand", () => {
		const p = makePlayer({
			tid: PLAYER.RETIRED,
			contractDemand: { amount: 1000, exp: 2026 },
		});
		assert.strictEqual(repairContracts(p).length, 1);
		assert.strictEqual(p.contractDemand, undefined);
	});

	test("owedByTids is fixed to match released contracts", () => {
		const released: Contract = {
			...contract(2026, [1000, 1000]),
			endedEarly: {
				season: 2026,
				phase: PHASE.REGULAR_SEASON,
				tid: 5,
			},
		};
		const p = makePlayer({
			tid: PLAYER.FREE_AGENT,
			contracts: [released],
			contractDemand: { amount: 1000, exp: 2026 },
			owedByTids: [2],
		});
		assert.strictEqual(repairContracts(p).length, 1);
		assert.deepStrictEqual(p.owedByTids, [5]);
	});
});
