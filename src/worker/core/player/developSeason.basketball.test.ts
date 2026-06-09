import { assert, test, vi } from "vitest";
import type { PlayerRatings } from "../../../common/types.basketball.ts";
import developSeason from "./developSeason.basketball.ts";

const seededRandom = (seed: number) => {
	let state = seed;
	return () => {
		state = (state * 16807) % 2147483647;
		return (state - 1) / 2147483646;
	};
};

const makeRatings = (): PlayerRatings => ({
	diq: 50,
	dnk: 50,
	drb: 50,
	endu: 50,
	fg: 50,
	ft: 50,
	fuzz: 0,
	hgt: 50,
	ins: 50,
	jmp: 50,
	oiq: 50,
	ovr: 50,
	pos: "G",
	pot: 50,
	pss: 50,
	reb: 50,
	season: 2026,
	skills: [],
	spd: 50,
	stre: 50,
	tp: 50,
});

const developWithCoaching = (
	coachingLevel: Parameters<typeof developSeason>[2],
) => {
	const ratings = makeRatings();
	const random = seededRandom(7);
	const spy = vi.spyOn(Math, "random").mockImplementation(random);
	try {
		developSeason(ratings, 22, coachingLevel);
	} finally {
		spy.mockRestore();
	}

	return ratings;
};

test("staff quality level has identical development results to the old budget level", () => {
	const budgetLevel = 62;

	assert.deepStrictEqual(
		developWithCoaching({
			level: budgetLevel,
			specialties: [],
		}),
		developWithCoaching(budgetLevel),
	);
});
