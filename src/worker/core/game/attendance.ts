import { finances } from "..";
import { bySport, DEFAULT_STADIUM_CAPACITY, isSport } from "../../../common";
import { facilitiesEffectAttendance } from "../../../common/budgetLevels";
import getAdjustedTicketPrice, {
	PLAYOFF_ATTENDANCE_FACTOR,
} from "../../../common/getAdjustedTicketPrice";
import type { TeamSeason } from "../../../common/types";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";

export { getAdjustedTicketPrice };

export const getBaseAttendance = ({
	hype,
	pop,
	playoffs,
}: {
	hype: number;
	pop: number;
	playoffs: boolean;
}) => {
	let baseAttendance = 10000 + (0.1 + 0.9 * hype ** 2) * pop * 1000000 * 0.01;

	if (isSport("hockey")) {
		baseAttendance *= 1.05;
	} else if (isSport("football")) {
		baseAttendance *= 28;
	}

	if (playoffs) {
		baseAttendance *= PLAYOFF_ATTENDANCE_FACTOR;
	}

	return baseAttendance;
};

// Ticket price adjusted for the salary cap, so it can be used in attendance calculation without distorting things for leagues with low/high caps. The exponential factor was hand-tuned to make this work in 1965.
const salaryCapFactor = () => {
	// Uses 90000 rather than defaultGameAttributes for unclear reasons, other sports should be tuned better
	const ratio = 90000 / g.get("salaryCap");
	if (ratio > 1) {
		return ratio ** 0.75;
	}
	return ratio;
};

// Adjustment added after auto ticket prices, to keep overall finances about the same as before auto ticket prices existed
const SPORT_FACTOR = bySport({
	baseball: 0.1,
	basketball: 0.75,
	football: 0.0575,
	hockey: 0.35,
});

const TICKET_PRICE_FACTOR = 45 * 50;

const facilitiesFactor = async (tid: number, teamSeasons: TeamSeason[]) => {
	const level = await finances.getLevelLastThree("facilities", {
		tid,
		teamSeasons,
	});
	return 1.0375 + facilitiesEffectAttendance(level);
};

// teamSeasons is last 3 seasons
export const getActualAttendance = async ({
	baseAttendance,
	randomize,
	stadiumCapacity,
	teamSeasons,
	tid,
	adjustedTicketPrice,
}: {
	baseAttendance: number;
	randomize: boolean;
	stadiumCapacity: number;
	teamSeasons: TeamSeason[];
	tid: number;
	adjustedTicketPrice: number;
}) => {
	const relativeTicketPrice = adjustedTicketPrice * salaryCapFactor();

	let attendance = baseAttendance;

	attendance *= SPORT_FACTOR;

	if (randomize) {
		attendance = random.gauss(attendance, 1000);
	}

	// Attendance depends on ticket price
	attendance *= TICKET_PRICE_FACTOR / relativeTicketPrice ** 2;

	// Attendance depends on facilities
	attendance *= await facilitiesFactor(tid, teamSeasons);

	attendance = helpers.bound(attendance, 0, stadiumCapacity);
	attendance = Math.round(attendance);

	return attendance;
};

// Takes attendance (stadiumCapacity) and returns ticketPrice, rather than taking adjustedTicketPrice and returning attendance. This assumes baseAttendance was calculated with playoffs: false
const getActualAttendanceInverted = async ({
	baseAttendance,
	stadiumCapacity,
	teamSeasons,
	tid,
}: {
	baseAttendance: number;
	stadiumCapacity: number;
	teamSeasons: TeamSeason[];
	tid: number;
}) => {
	let temp = stadiumCapacity;

	temp /= await facilitiesFactor(tid, teamSeasons);
	temp /= TICKET_PRICE_FACTOR;
	temp /= SPORT_FACTOR;
	temp /= baseAttendance;

	let ticketPrice = Math.sqrt(1 / temp);
	ticketPrice /= salaryCapFactor();

	if (ticketPrice < 0) {
		return 0.01;
	}

	return Math.round(ticketPrice * 100) / 100;
};

export const getAutoTicketPrice = async ({
	hype,
	pop,
	stadiumCapacity,
	teamSeasons,
	tid,
}: {
	hype: number;
	pop: number;
	stadiumCapacity: number;
	teamSeasons: TeamSeason[];
	tid: number;
}) => {
	if (stadiumCapacity <= 0) {
		return 50;
	}

	const baseAttendance = getBaseAttendance({
		hype,
		pop,
		playoffs: false,
	});

	return getActualAttendanceInverted({
		baseAttendance,
		stadiumCapacity,
		teamSeasons,
		tid,
	});
};

export const getAutoTicketPriceByTid = async (tid: number) => {
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[
			[tid, g.get("season") - 2],
			[tid, g.get("season")],
		],
	);

	let hype: number;
	let pop: number;
	let stadiumCapacity: number;
	if (teamSeasons.length === 0) {
		// This happens for expansion teams in the offseason, they have no teamSeason yet

		const t = await idb.cache.teams.get(tid);
		if (!t) {
			throw new Error("No team found");
		}

		hype = 0.5;
		pop = t.pop ?? 1;
		stadiumCapacity = t.stadiumCapacity ?? DEFAULT_STADIUM_CAPACITY;
	} else {
		const teamSeason = teamSeasons.at(-1)!;
		hype = teamSeason.hype;
		pop = teamSeason.pop;
		stadiumCapacity = teamSeason.stadiumCapacity;
	}

	return getAutoTicketPrice({
		hype,
		pop,
		stadiumCapacity,
		teamSeasons,
		tid,
	});
};
