import assert from "assert";
import helpers from "../../../test/helpers";
import {
	getActualAttendance,
	getAdjustedTicketPrice,
	getAutoTicketPrice,
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
		const adjustedTicketPrice = getAdjustedTicketPrice(
			rawTicketPrice,
			playoffs,
		);
		const attendance = getActualAttendance({
			baseAttendance,
			randomize: false,
			stadiumCapacity,
			teamSeasons: [],
			adjustedTicketPrice,
		});

		playoffs = true;
		const baseAttendancePlayoffs = getBaseAttendance({
			hype,
			pop,
			playoffs,
		});
		const adjustedTicketPricePlayoffs = getAdjustedTicketPrice(
			rawTicketPrice,
			playoffs,
		);
		const attendancePlayoffs = getActualAttendance({
			baseAttendance: baseAttendancePlayoffs,
			randomize: false,
			stadiumCapacity,
			teamSeasons: [],
			adjustedTicketPrice: adjustedTicketPricePlayoffs,
		});

		assert(baseAttendancePlayoffs > baseAttendance);
		assert(adjustedTicketPricePlayoffs > adjustedTicketPrice);
		assert.strictEqual(attendancePlayoffs, attendance);
	});

	test("getAutoTicketPrice works", () => {
		const hype = 0.5;
		const pop = 1;
		const playoffs = false;

		// Test for small and large stadiumCapacity, to test its ability to find a high and low ticket price
		for (const stadiumCapacity of [500, 100000]) {
			const rawTicketPrice = getAutoTicketPrice({
				stadiumCapacity,
				hype,
				pop,
				teamSeasons: [],
			});

			const baseAttendance = getBaseAttendance({
				hype,
				pop,
				playoffs,
			});
			const adjustedTicketPrice = getAdjustedTicketPrice(
				rawTicketPrice,
				playoffs,
			);
			const attendance = getActualAttendance({
				baseAttendance,
				randomize: false,
				stadiumCapacity,
				teamSeasons: [],
				adjustedTicketPrice,
			});

			// The given ticket price is low enough to fill the stadium
			assert.strictEqual(attendance, stadiumCapacity);

			const adjustedTicketPrice2 = getAdjustedTicketPrice(
				rawTicketPrice + 1,
				playoffs,
			);
			const attendance2 = getActualAttendance({
				baseAttendance,
				randomize: false,
				stadiumCapacity,
				teamSeasons: [],
				adjustedTicketPrice: adjustedTicketPrice2,
			});

			// Raising the ticket price by just $1 will not fill the stadium
			assert(attendance2 < stadiumCapacity);
		}
	});
});
