import { DEFAULT_LEVEL, MAX_LEVEL } from "../../../common/budgetLevels.ts";
import { PLAYER } from "../../../common/constants.ts";
import { helpers } from "../../../common/helpers.ts";
import { choice, randInt } from "../../../common/random.ts";
import {
	COACH_SLOTS,
	COACH_SPECIALTIES,
	type CoachSlot,
	type CoachSpecialty,
	type CoachingEffectInput,
} from "../../../common/staff.ts";
import type { Coach, Team } from "../../../common/types.ts";
import { idb } from "../../db/index.ts";
import { g } from "../../util/index.ts";
import finances from "../finances/index.ts";
import playerName from "../player/name.ts";

const assignedCoach = (coaches: Coach[], tid: number, slot: CoachSlot) =>
	coaches.find((coach) => coach.tid === tid && coach.slot === slot);

const hireQueues = new Map<string, Promise<unknown>>();

const queueHire = async <T>(
	tid: number,
	slot: CoachSlot,
	callback: () => Promise<T>,
) => {
	const key = `${tid}:${slot}`;
	const previous = hireQueues.get(key) ?? Promise.resolve();
	const next = previous.catch(() => undefined).then(callback);
	hireQueues.set(key, next);

	try {
		return await next;
	} finally {
		if (hireQueues.get(key) === next) {
			hireQueues.delete(key);
		}
	}
};

export const genCoach = async ({
	quality,
	slot,
	tid = PLAYER.FREE_AGENT,
}: {
	quality: number;
	slot?: CoachSlot;
	tid?: number;
}) => {
	const name = await playerName();

	return {
		age: randInt(32, 72),
		firstName: name.firstName,
		lastName: name.lastName,
		quality: helpers.bound(Math.round(quality), 1, MAX_LEVEL),
		slot,
		specialty: choice(COACH_SPECIALTIES),
		tid,
	};
};

export const getTeamStaff = (coaches: Coach[], tid: number) =>
	COACH_SLOTS.map((slot) => assignedCoach(coaches, tid, slot)).filter(
		(coach): coach is Coach => coach !== undefined,
	);

export const getDevelopmentInfoFromCoaches = (
	coaches: Coach[],
	tid: number,
): CoachingEffectInput => {
	let qualityTotal = 0;
	const specialties: CoachSpecialty[] = [];

	for (const slot of COACH_SLOTS) {
		const coach = assignedCoach(coaches, tid, slot);
		if (coach) {
			qualityTotal += coach.quality;
			specialties.push(coach.specialty);
		} else {
			qualityTotal += DEFAULT_LEVEL;
		}
	}

	return {
		level: helpers.bound(
			Math.round(qualityTotal / COACH_SLOTS.length),
			1,
			MAX_LEVEL,
		),
		specialties,
	};
};

export const getDevelopmentInfo = async (
	tid: number,
): Promise<CoachingEffectInput> => {
	const coaches = await idb.cache.staff.getAll();
	return getDevelopmentInfoFromCoaches(coaches, tid);
};

const getCoachingLevel = async (t: Team) => {
	const season = g.get("season");
	const teamSeasons = await idb.getCopies.teamSeasons(
		{
			tid: t.tid,
			seasons: [season - 3, season - 1],
		},
		"noCopyCache",
	);

	return finances.getLevelLastThree("coaching", {
		t,
		teamSeasons,
	});
};

const ensureTeamStaff = async (
	coaches: Coach[],
	tid: number,
	quality: number,
) => {
	for (const slot of COACH_SLOTS) {
		if (!assignedCoach(coaches, tid, slot)) {
			const coach = await genCoach({
				quality,
				slot,
				tid,
			});
			const coachId = await idb.cache.staff.add(coach);
			coaches.push({
				...coach,
				coachId,
			});
		}
	}
};

const genFreeAgentQuality = () =>
	helpers.bound(randInt(DEFAULT_LEVEL - 20, DEFAULT_LEVEL + 55), 1, MAX_LEVEL);

export const bootstrapLeagueStaff = async () => {
	const coaches = await idb.cache.staff.getAll();
	if (coaches.length > 0) {
		return;
	}

	const teams = (await idb.cache.teams.getAll()).filter((t) => !t.disabled);

	for (const t of teams) {
		await ensureTeamStaff(coaches, t.tid, await getCoachingLevel(t));
	}

	const targetFreeAgentCoaches = Math.max(12, teams.length);
	let numFreeAgentCoaches = coaches.filter(
		(coach) => coach.tid === PLAYER.FREE_AGENT,
	).length;

	while (numFreeAgentCoaches < targetFreeAgentCoaches) {
		const coach = await genCoach({
			quality: genFreeAgentQuality(),
		});
		const coachId = await idb.cache.staff.add(coach);
		coaches.push({
			...coach,
			coachId,
		});
		numFreeAgentCoaches += 1;
	}
};

const makeCoachFreeAgent = async (coach: Coach) => {
	coach.tid = PLAYER.FREE_AGENT;
	delete coach.slot;
	await idb.cache.staff.put(coach);
};

export const advanceAges = async () => {
	const coaches = await idb.cache.staff.getAll();

	for (const coach of coaches) {
		coach.age += 1;
		await idb.cache.staff.put(coach);
	}
};

const hireBestAffordableCoach = async (
	slot: CoachSlot,
	tid: number,
	budgetLevel: number,
) => {
	const coaches = await idb.cache.staff.getAll();
	const coach = coaches
		.filter(
			(coach2) =>
				coach2.tid === PLAYER.FREE_AGENT && coach2.quality <= budgetLevel,
		)
		.sort((a, b) => b.quality - a.quality || a.coachId - b.coachId)[0];

	if (coach) {
		coach.tid = tid;
		coach.slot = slot;
		await idb.cache.staff.put(coach);
	} else {
		await idb.cache.staff.add(
			await genCoach({
				quality: budgetLevel,
				slot,
				tid,
			}),
		);
	}
};

export const autoHireByBudget = async (tid: number, budgetLevel: number) => {
	for (const slot of COACH_SLOTS) {
		const coaches = await idb.cache.staff.getAll();
		const coach = assignedCoach(coaches, tid, slot);

		if (
			coach &&
			coach.quality <= budgetLevel &&
			coach.quality >= budgetLevel - 12
		) {
			continue;
		}

		if (coach) {
			await makeCoachFreeAgent(coach);
		}

		await hireBestAffordableCoach(slot, tid, budgetLevel);
	}
};

export const hire = async ({
	coachId,
	slot,
	tid,
}: {
	coachId: number;
	slot: CoachSlot;
	tid: number;
}) => {
	await queueHire(tid, slot, async () => {
		const t = await idb.cache.teams.get(tid);
		if (!t || t.disabled) {
			throw new Error("Invalid team");
		}

		const coaches = await idb.cache.staff.getAll();
		if (assignedCoach(coaches, tid, slot)) {
			throw new Error("That staff slot is already filled.");
		}

		const coach = await idb.cache.staff.get(coachId);
		if (!coach || coach.tid !== PLAYER.FREE_AGENT) {
			throw new Error("That coach is not available.");
		}

		if (coach.quality > t.budget.coaching) {
			throw new Error("Your coaching budget level is too low for that coach.");
		}

		coach.tid = tid;
		coach.slot = slot;
		await idb.cache.staff.put(coach);
	});
};

export const fire = async ({
	coachId,
	tid,
}: {
	coachId: number;
	tid: number;
}) => {
	const coach = await idb.cache.staff.get(coachId);
	if (!coach || coach.tid !== tid) {
		throw new Error("Invalid coach.");
	}

	await makeCoachFreeAgent(coach);
};

export default {
	advanceAges,
	autoHireByBudget,
	bootstrapLeagueStaff,
	fire,
	genCoach,
	getDevelopmentInfo,
	getDevelopmentInfoFromCoaches,
	getTeamStaff,
	hire,
};
