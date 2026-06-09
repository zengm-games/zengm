import { assert, beforeEach, test } from "vitest";
import { PLAYER } from "../../../common/constants.ts";
import { COACH_SLOTS, COACH_SPECIALTIES } from "../../../common/staff.ts";
import { resetCache } from "../../../test/helpers.ts";
import { idb } from "../../db/index.ts";
import { autoHireByBudget } from "./index.ts";

const specialty = COACH_SPECIALTIES[0]!;

beforeEach(async () => {
	await resetCache({
		staff: [
			{
				age: 55,
				coachId: 1,
				firstName: "Too",
				lastName: "Expensive",
				quality: 90,
				slot: "headCoach",
				specialty,
				tid: 0,
			},
			{
				age: 44,
				coachId: 2,
				firstName: "Affordable",
				lastName: "One",
				quality: 47,
				specialty,
				tid: PLAYER.FREE_AGENT,
			},
			{
				age: 45,
				coachId: 3,
				firstName: "Affordable",
				lastName: "Two",
				quality: 50,
				specialty,
				tid: PLAYER.FREE_AGENT,
			},
			{
				age: 46,
				coachId: 4,
				firstName: "Affordable",
				lastName: "Three",
				quality: 40,
				specialty,
				tid: PLAYER.FREE_AGENT,
			},
			{
				age: 47,
				coachId: 5,
				firstName: "Still",
				lastName: "TooExpensive",
				quality: 60,
				specialty,
				tid: PLAYER.FREE_AGENT,
			},
		],
	});
});

test("AI auto-hiring respects the coaching budget level", async () => {
	await autoHireByBudget(0, 50);

	const coaches = await idb.cache.staff.getAll();
	const teamStaff = coaches.filter((coach) => coach.tid === 0);

	assert.strictEqual(teamStaff.length, COACH_SLOTS.length);
	assert(teamStaff.every((coach) => coach.quality <= 50));
	assert.deepStrictEqual(
		teamStaff.map((coach) => coach.slot).sort(),
		[...COACH_SLOTS].sort(),
	);

	const firedCoach = coaches.find((coach) => coach.coachId === 1);
	assert.strictEqual(firedCoach?.tid, PLAYER.FREE_AGENT);
	assert.strictEqual(firedCoach?.slot, undefined);

	const unaffordableCoach = coaches.find((coach) => coach.coachId === 5);
	assert.strictEqual(unaffordableCoach?.tid, PLAYER.FREE_AGENT);
});
