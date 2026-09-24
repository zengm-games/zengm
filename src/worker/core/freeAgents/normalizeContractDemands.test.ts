import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { resetCache, resetG } from "../../../test/helpers.ts";
import { g, local } from "../../util/index.ts";
import { player } from "../index.ts";
import normalizeContractDemands from "./normalizeContractDemands.ts";
import { getCumulativeWeights } from "./getCumulativeWeights.ts";

beforeEach(() => resetG());
afterEach(() => {
	vi.restoreAllMocks();
	local.playerOvrMeanStdStale = true;
});

test("handles a single free agent with a non-finite value", async () => {
	const p = { ...player.generate(-1, 25, 2020, false, 50), pid: 0 };
	p.value = Number.NaN;
	await resetCache({ players: [p], teams: [{ tid: 0, disabled: false }] });
	await expect(
		normalizeContractDemands({ type: "freeAgentsOnly" }),
	).resolves.toBeUndefined();
	expect(Number.isFinite(p.contract.amount)).toBe(true);
});

test("finite ratings in repeat-season mode can overflow the auction exponent", async () => {
	// A strong, tightly clustered league can normalize its weak outliers below zero.
	Object.assign(g, {
		repeatSeason: { type: "players", startingSeason: g.get("season") },
	});
	const players = [
		34,
		0,
		...Array<number>(99).fill(65),
		...Array<number>(99).fill(75),
	].map((ovr, pid) => {
		const p = { ...player.generate(-1, 25, 2020, false, 50), pid };
		if (pid >= 2) {
			p.tid = 0;
		}
		p.ratings[0]!.ovr = ovr;
		p.ratings[0]!.pot = ovr;
		return p;
	});
	await resetCache({ players, teams: [{ tid: 0, disabled: false }] });
	local.playerOvrMeanStdStale = true;
	const freeAgents = players.slice(0, 2);
	for (const p of freeAgents) {
		await player.updateValues(p);
	}
	expect(freeAgents.every((p) => Number.isFinite(p.value) && p.value < 0)).toBe(
		true,
	);
	const softmaxValues = freeAgents.map((p) => -(p.value ** 2) * 0.35);
	expect(Math.exp((7.5 * softmaxValues[1]!) / softmaxValues[0]!)).toBe(
		Infinity,
	);
	const weights = getCumulativeWeights(
		softmaxValues.map((softmaxValue) => ({ softmaxValue })),
		7.5,
	);
	expect(weights.every(Number.isFinite)).toBe(true);
	Object.assign(g, { salaryCap: 1000000 });
	await expect(
		normalizeContractDemands({ type: "freeAgentsOnly" }),
	).resolves.toBeUndefined();
});
