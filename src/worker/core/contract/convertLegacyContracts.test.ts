import { assert, describe, test } from "vitest";
import { PHASE, PLAYER } from "../../../common/constants.ts";
import type { Contract } from "../../../common/types.ts";
import {
	applyLegacyReleasedPlayers,
	convertLegacyContracts,
	type LegacyPlayer,
} from "./convertLegacyContracts.ts";

const salaries = (rows: [number, number, number][]) => {
	const output = [];
	for (const [start, exp, amount] of rows) {
		for (let season = start; season <= exp; season++) {
			output.push({ season, amount });
		}
	}
	return output;
};

const basePlayer: LegacyPlayer = {
	draft: {
		round: 1,
		tid: 3,
		year: 2014,
	},
	retiredYear: Infinity,
	tid: 5,
};

const leagueState = {
	fractionCurrentSeasonPaid: 0.5,
	phase: PHASE.REGULAR_SEASON,
	season: 2019,
};

describe("convertLegacyContracts", () => {
	test("rookie contract and current contract, with the current season partially paid", () => {
		const { contracts, contractDemand } = convertLegacyContracts({
			p: {
				...basePlayer,
				contract: { amount: 5000, exp: 2020 },
				salaries: salaries([
					[2015, 2017, 1000],
					[2018, 2020, 5000],
				]),
			},
			leagueState,
			releasedPlayers: [],
			releaseEvents: [],
			signingEvents: [],
		});

		assert.strictEqual(contractDemand, undefined);
		assert.strictEqual(contracts.length, 2);

		const [rookie, current] = contracts;
		assert.strictEqual(rookie!.type, "rookie");
		// No signing event for a rookie contract, p.draft has that info
		assert.strictEqual(rookie!.eid, undefined);
		assert.strictEqual(rookie!.start, 2015);
		assert.deepStrictEqual(rookie!.amounts, [1000, 1000, 1000]);
		assert.strictEqual(rookie!.payments.length, 3);

		assert.strictEqual(current!.type, "unknown");
		assert.strictEqual(current!.start, 2018);
		assert.deepStrictEqual(current!.amounts, [5000, 5000, 5000]);
		// No stats or transactions, so the rookie contract's payer is unknown, and the current contract is assumed to be paid by his current team
		assert(
			rookie!.payments.every(
				(payment) => payment.tid === PLAYER.DOES_NOT_EXIST,
			),
		);
		assert.deepStrictEqual(current!.payments, [
			{ season: 2018, tid: 5, amount: 5000 },
			{ season: 2019, tid: 5, amount: 2500 },
		]);
	});

	test("adjacent contracts with the same amount are split by a signing event", () => {
		const { contracts } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 0, tid: -1, year: 2010 },
				contract: { amount: 2000, exp: 2021 },
				salaries: salaries([[2016, 2021, 2000]]),
			},
			leagueState,
			releasedPlayers: [],
			releaseEvents: [],
			signingEvents: [
				{
					eid: 10,
					type: "freeAgent",
					season: 2015,
					phase: PHASE.FREE_AGENCY,
					tid: 2,
					amount: 2000,
					exp: 2018,
				},
				{
					eid: 11,
					type: "reSigned",
					season: 2018,
					phase: PHASE.RESIGN_PLAYERS,
					tid: 5,
					amount: 2000,
					exp: 2021,
				},
			],
		});

		assert.strictEqual(contracts.length, 2);
		assert.strictEqual(contracts[0]!.type, "freeAgent");
		assert.strictEqual(contracts[0]!.start, 2016);
		assert.strictEqual(contracts[0]!.amounts.length, 3);
		assert.strictEqual(contracts[0]!.eid, 10);
		assert.strictEqual(contracts[1]!.type, "reSign");
		assert.strictEqual(contracts[1]!.start, 2019);
		assert.strictEqual(contracts[1]!.amounts.length, 3);
		assert.strictEqual(contracts[1]!.eid, 11);
	});

	test("free agent with a contract still owed by the team that released him", () => {
		const { contracts, contractDemand } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 0, tid: -1, year: 2010 },
				tid: PLAYER.FREE_AGENT,
				contract: { amount: 750, exp: 2019 },
				salaries: salaries([[2018, 2021, 3000]]),
			},
			leagueState,
			releasedPlayers: [
				{ pid: 0, tid: 7, contract: { amount: 3000, exp: 2021 } },
			],
			releaseEvents: [{ season: 2019, phase: PHASE.REGULAR_SEASON, tid: 7 }],
			signingEvents: [],
		});

		assert.deepStrictEqual(contractDemand, { amount: 750, exp: 2019 });
		assert.strictEqual(contracts.length, 1);
		assert.deepStrictEqual(contracts[0]!.endedEarly, {
			season: 2019,
			phase: PHASE.REGULAR_SEASON,
			reason: "released",
			tid: 7,
		});
	});

	test("released and then signed by another team in the same season", () => {
		const { contracts } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 0, tid: -1, year: 2010 },
				contract: { amount: 1000, exp: 2019 },
				salaries: [
					...salaries([[2018, 2020, 4000]]),
					...salaries([[2019, 2019, 1000]]),
				],
			},
			leagueState,
			releasedPlayers: [
				{ pid: 0, tid: 7, contract: { amount: 4000, exp: 2020 } },
			],
			releaseEvents: [],
			signingEvents: [],
		});

		assert.strictEqual(contracts.length, 2);

		// Current contract is last, even though it starts after the released one
		assert.strictEqual(contracts[0]!.endedEarly?.reason, "released");
		assert.deepStrictEqual(contracts[0]!.amounts, [4000, 4000, 4000]);
		assert.strictEqual(contracts[1]!.endedEarly, undefined);
		assert.deepStrictEqual(contracts[1]!.amounts, [1000]);
	});

	test("unsigned draft pick on a team has a contract demand, not a contract", () => {
		const { contracts, contractDemand } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 1, tid: 5, year: 2019 },
				contract: { amount: 1500, exp: 2019, rookie: true },
				salaries: [],
			},
			leagueState: { ...leagueState, phase: PHASE.AFTER_DRAFT },
			releasedPlayers: [],
			releaseEvents: [],
			signingEvents: [],
		});

		assert.strictEqual(contracts.length, 0);
		assert.deepStrictEqual(contractDemand, {
			amount: 1500,
			exp: 2019,
			rookie: true,
		});
	});

	test("retired before his contract ended", () => {
		const { contracts, contractDemand } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 0, tid: -1, year: 2010 },
				tid: PLAYER.RETIRED,
				retiredYear: 2017,
				contract: { amount: 2000, exp: 2019 },
				salaries: salaries([[2016, 2019, 2000]]),
			},
			leagueState,
			releasedPlayers: [],
			releaseEvents: [],
			signingEvents: [],
		});

		assert.strictEqual(contractDemand, undefined);
		assert.strictEqual(contracts.length, 1);
		assert.strictEqual(contracts[0]!.endedEarly?.reason, "retired");
		assert.deepStrictEqual(
			contracts[0]!.payments.map((payment) => payment.season),
			[2016, 2017],
		);
	});

	test("rookieResign marks the expiring contract as a rookie contract", () => {
		const { contracts, contractDemand } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 2, tid: 5, year: 2015 },
				tid: PLAYER.FREE_AGENT,
				contract: { amount: 3000, exp: 2022, rookieResign: true },
				salaries: [
					// Not the first contract after the draft, so this would not be detected as a rookie contract otherwise
					...salaries([[2016, 2016, 750]]),
					...salaries([[2017, 2019, 900]]),
				],
			},
			leagueState: { ...leagueState, phase: PHASE.RESIGN_PLAYERS },
			releasedPlayers: [],
			releaseEvents: [],
			signingEvents: [],
		});

		assert.deepStrictEqual(contractDemand, { amount: 3000, exp: 2022 });
		assert.strictEqual(contracts.at(-1)!.type, "rookie");
	});
});

describe("estimating which teams paid", () => {
	test("split by games played when traded during the season, and released contracts are paid by the team that released him", () => {
		const { contracts } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 0, tid: -1, year: 2010 },
				tid: 9,
				contract: { amount: 1000, exp: 2019 },
				salaries: [
					...salaries([[2017, 2019, 4000]]),
					...salaries([[2019, 2019, 1000]]),
				],
				stats: [
					{ season: 2017, tid: 1, playoffs: false, gp: 60 },
					{ season: 2017, tid: 2, playoffs: false, gp: 20 },
					{ season: 2017, tid: 2, playoffs: true, gp: 10 },
					{ season: 2018, tid: 2, playoffs: false, gp: 0 },
					{ season: 2019, tid: 2, playoffs: false, gp: 10 },
					{ season: 2019, tid: 9, playoffs: false, gp: 30 },
				],
				transactions: [],
			},
			leagueState: { ...leagueState, phase: PHASE.PLAYOFFS },
			releasedPlayers: [
				{ pid: 0, tid: 2, contract: { amount: 4000, exp: 2019 } },
			],
			releaseEvents: [{ season: 2019, phase: PHASE.REGULAR_SEASON, tid: 2 }],
			signingEvents: [
				{
					eid: 12,
					type: "freeAgent",
					season: 2019,
					phase: PHASE.REGULAR_SEASON,
					tid: 9,
					amount: 1000,
					exp: 2019,
				},
			],
		});

		const [released, current] = contracts;
		assert.deepStrictEqual(released!.payments, [
			{ season: 2017, tid: 1, amount: 3000 },
			{ season: 2017, tid: 2, amount: 1000 },
			{ season: 2018, tid: 2, amount: 4000 },

			// Half of the current season has been paid
			{ season: 2019, tid: 2, amount: 2000 },
		]);

		// Signed during the season, so only paid by the team that signed him
		assert.deepStrictEqual(current!.payments, [
			{ season: 2019, tid: 9, amount: 500 },
		]);
	});

	test("no stats, so use the team from his latest transaction", () => {
		const { contracts } = convertLegacyContracts({
			p: {
				...basePlayer,
				draft: { round: 0, tid: -1, year: 2010 },
				tid: PLAYER.FREE_AGENT,
				contract: { amount: 750, exp: 2019 },
				salaries: salaries([[2016, 2017, 2000]]),
				stats: [],
				transactions: [
					{ season: 2015, phase: PHASE.FREE_AGENCY, tid: 4 },
					{ season: 2018, phase: PHASE.FREE_AGENCY, tid: 6 },
				],
			},
			leagueState,
			releasedPlayers: [],
			releaseEvents: [],
			signingEvents: [],
		});

		assert.deepStrictEqual(
			contracts[0]!.payments.map((payment) => payment.tid),
			[4, 4],
		);
	});
});

describe("applyLegacyReleasedPlayers", () => {
	test("adds a contract before the current contract if there is no matching one", () => {
		const currentContract: Contract = {
			type: "unknown",
			start: 2019,
			amounts: [1000],
			payments: [],
		};
		const contracts = [currentContract];
		applyLegacyReleasedPlayers({
			contractDemand: undefined,
			contracts,
			leagueState,
			releasedPlayers: [
				{ pid: 0, tid: 7, contract: { amount: -500, exp: 2020 } },
			],
			releaseEvents: [],
			tid: 3,
		});

		assert.strictEqual(contracts.length, 2);
		assert.strictEqual(contracts[1], currentContract);
		assert.strictEqual(currentContract.endedEarly, undefined);
		const released = contracts[0]!;
		assert.strictEqual(released.start, 2019);
		assert.deepStrictEqual(released.amounts, [-500, -500]);
		assert.strictEqual(released.endedEarly?.tid, 7);
	});
});
