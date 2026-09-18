import { assert, beforeEach, test, vi } from "vitest";
import type { PlayerWithoutKey } from "../../../common/types.ts";
import { resetG } from "../../../test/helpers.ts";
import { player, team } from "../index.ts";
import { getTeamOvrDiffs } from "./runPicks.ts";

beforeEach(() => {
	resetG();
});

const makePlayer = (pos: string, value: number, pid: number) =>
	({
		pid,
		value,
		injury: { type: "Healthy", gamesRemaining: 0 },
		ratings: [{ pos, ovr: 40, ovrs: { [pos]: 50 }, fuzz: 7 }],
	}) as unknown as PlayerWithoutKey;

const originalDiffs = (
	roster: PlayerWithoutKey[],
	candidates: PlayerWithoutKey[],
) => {
	const forOvr = (p: PlayerWithoutKey) => {
		const ratings = p.ratings.at(-1)!;
		return {
			pid: p.pid,
			injury: p.injury,
			value: p.value,
			ratings: {
				ovr: player.fuzzRating(ratings.ovr, ratings.fuzz),
				ovrs: player.fuzzOvrs(ratings.ovrs, ratings.fuzz),
				pos: ratings.pos,
			},
		};
	};
	const prepared = roster.map(forOvr);
	const baseline = team.ovr(prepared, { wholeRoster: true });
	return candidates.map(
		(p) => team.ovr([...prepared, forOvr(p)], { wholeRoster: true }) - baseline,
	);
};

test("draft and free-agent roster differences retain exact scores and unchanged input", () => {
	const roster = [
		makePlayer("RB", 0, 1),
		makePlayer("QB", 1e17, 2),
		makePlayer("WR", 1e17, 3),
		makePlayer("OL", 50, 4),
	];
	const candidates = [
		makePlayer("RB", 1, 5),
		makePlayer("K", 60, 6),
		makePlayer("WR", 2e17, 7),
		makePlayer("QB", 1e17, 8),
	];
	const before = structuredClone({ roster, candidates });
	assert.deepEqual(
		getTeamOvrDiffs(roster, candidates),
		originalDiffs(roster, candidates),
	);
	assert.deepEqual(
		getTeamOvrDiffs([], candidates),
		originalDiffs([], candidates),
	);
	assert.deepEqual(getTeamOvrDiffs(roster, []), []);
	assert.deepEqual({ roster, candidates }, before);
});

test("malformed candidate or baseline values retain the original fallback scores", () => {
	const roster = [makePlayer("QB", 70, 1), makePlayer("WR", 50, 2)];
	const candidates = [Number.NaN, Infinity, -Infinity].map((value, i) =>
		makePlayer("QB", value, i + 3),
	);
	assert.deepEqual(
		getTeamOvrDiffs(roster, candidates),
		originalDiffs(roster, candidates),
	);
	roster[0]!.value = Number.NaN;
	assert.deepEqual(
		getTeamOvrDiffs(roster, candidates),
		originalDiffs(roster, candidates),
	);
});

test("unsupported positions retain the original error", () => {
	assert.throws(() => getTeamOvrDiffs([], [makePlayer("unknown", 50, 0)]));
	assert.throws(() => originalDiffs([], [makePlayer("unknown", 50, 0)]));
});

test("football comparisons retain every fuzz call and consume no random draws", () => {
	const roster = [makePlayer("QB", 70, 1), makePlayer("WR", 50, 2)];
	const candidates = [makePlayer("QB", 80, 3), makePlayer("RB", 60, 4)];
	const fuzzRating = vi.spyOn(player, "fuzzRating");
	const fuzzOvrs = vi.spyOn(player, "fuzzOvrs");
	const random = vi.spyOn(Math, "random").mockImplementation(() => {
		throw new Error("Unexpected random draw");
	});
	try {
		getTeamOvrDiffs(roster, candidates);
		assert.strictEqual(
			fuzzRating.mock.calls.length,
			roster.length + candidates.length,
		);
		assert.strictEqual(
			fuzzOvrs.mock.calls.length,
			roster.length + candidates.length,
		);
		assert.strictEqual(random.mock.calls.length, 0);
	} finally {
		fuzzRating.mockRestore();
		fuzzOvrs.mockRestore();
		random.mockRestore();
	}
});
