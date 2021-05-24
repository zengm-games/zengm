import assert from "assert";
import helpers from "../../../test/helpers";
import {
	getActualAttendance,
	getAdjustedTicketPrice,
	getBaseAttendance,
} from "./attendance";

describe("worker/core/game/attendance", () => {
	beforeAll(() => {
		helpers.resetG();
	});

	test("playoffs ticket price adjustment balances playoff attendance increase", () => {
		const hype = 0.5;
		const pop = 1;
		const rawTicketPrice = 25;
		const stadiumCapacity = 50000;

		let playoffs = false;
		const baseAttendance = getBaseAttendance({
			hype,
			pop,
			playoffs,
		});
		const ticketPrice = getAdjustedTicketPrice(rawTicketPrice, playoffs);
		const attendance = getActualAttendance({
			baseAttendance,
			randomize: false,
			stadiumCapacity,
			teamSeasons: [],
			ticketPrice,
		});

		playoffs = true;
		const baseAttendancePlayoffs = getBaseAttendance({
			hype,
			pop,
			playoffs,
		});
		const ticketPricePlayoffs = getAdjustedTicketPrice(
			rawTicketPrice,
			playoffs,
		);
		const attendancePlayoffs = getActualAttendance({
			baseAttendance: baseAttendancePlayoffs,
			randomize: false,
			stadiumCapacity,
			teamSeasons: [],
			ticketPrice: ticketPricePlayoffs,
		});

		assert(baseAttendancePlayoffs > baseAttendance);
		assert(ticketPricePlayoffs > ticketPrice);
		assert.strictEqual(attendancePlayoffs, attendance);
	});
});
