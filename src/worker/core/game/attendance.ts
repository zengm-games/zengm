import { finances } from "..";
import { isSport } from "../../../common";
import type { TeamSeason } from "../../../common/types";
import { g, helpers, random } from "../../util";

export const getBaseAttendance = ({
	hype,
	pop,
	playoffs,
}: {
	hype: number;
	pop: number;
	playoffs: boolean;
}) => {
	// Base on home team
	let baseAttendance = 10000 + (0.1 + 0.9 * hype ** 2) * pop * 1000000 * 0.01; // Base attendance - between 2% and 0.2% of the region

	if (isSport("hockey")) {
		baseAttendance *= 1.05;
	} else if (isSport("football")) {
		baseAttendance *= 28;
	}

	if (playoffs) {
		baseAttendance *= 1.5; // Playoff bonus
	}

	return baseAttendance;
};

// teamSeasons is last 3 seasons
export const getActualAttendance = ({
	baseAttendance,
	randomize,
	stadiumCapacity,
	teamSeasons,
	ticketPrice,
}: {
	baseAttendance: number;
	randomize: boolean;
	stadiumCapacity: number;
	teamSeasons: TeamSeason[];
	ticketPrice: number;
}) => {
	// Ticket price adjusted for the salary cap, so it can be used in attendance calculation without distorting things for leagues with low/high caps. The exponential factor was hand-tuned to make this work in 1965.
	const relativeTicketPrice =
		ticketPrice * (90000 / g.get("salaryCap")) ** 0.75;

	let attendance = baseAttendance;

	if (isSport("football")) {
		attendance *= 0.23;
	}

	if (randomize) {
		attendance = random.gauss(attendance, 1000);
	}

	// Attendance depends on ticket price
	attendance *= (45 * 50) / relativeTicketPrice ** 2;

	// Attendance depends on facilities
	attendance *=
		1 +
		(0.075 *
			(g.get("numActiveTeams") -
				finances.getRankLastThree(teamSeasons, "expenses", "facilities"))) /
			(g.get("numActiveTeams") - 1);

	attendance = helpers.bound(attendance, 0, stadiumCapacity);
	attendance = Math.round(attendance);

	return attendance;
};
