import assert from "node:assert/strict";
import testHelpers from "../../../test/helpers";
import {
	getActualAttendance,
	getAdjustedTicketPrice,
	getAutoTicketPrice,
	getBaseAttendance,
} from "./attendance";
import team from "../team";
import { helpers } from "../../util";

describe("worker/core/game/attendance", () => {
	beforeAll(async () => {
		testHelpers.resetG();

		const teamsDefault = helpers.getTeamsDefault().slice(0, 3);
		const teams = teamsDefault.map(team.generate);

		await testHelpers.resetCache({
			teams,
		});
	});

	test("playoffs ticket price adjustment balances playoff attendance increase", async () => {
		const hype = 0.5;
		const pop = 1;
		const rawTicketPrice = 25;
		const stadiumCapacity = 50000;
		const tid = 0;

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
		const attendance = await getActualAttendance({
			baseAttendance,
			randomize: false,
			stadiumCapacity,
			teamSeasons: [],
			tid,
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
		const attendancePlayoffs = await getActualAttendance({
			baseAttendance: baseAttendancePlayoffs,
			randomize: false,
			stadiumCapacity,
			teamSeasons: [],
			tid,
			adjustedTicketPrice: adjustedTicketPricePlayoffs,
		});

		assert(baseAttendancePlayoffs > baseAttendance);
		assert(adjustedTicketPricePlayoffs > adjustedTicketPrice);
		assert.strictEqual(attendancePlayoffs, attendance);
	});

	test("getAutoTicketPrice works", async () => {
		const hype = 0.5;
		const pop = 1;
		const playoffs = false;
		const tid = 0;

		// Test for small and large stadiumCapacity, to test its ability to find a high and low ticket price
		for (const stadiumCapacity of [500, 100000]) {
			const rawTicketPrice = await getAutoTicketPrice({
				stadiumCapacity,
				hype,
				pop,
				teamSeasons: [],
				tid: 0,
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
			const attendance = await getActualAttendance({
				baseAttendance,
				randomize: false,
				stadiumCapacity,
				teamSeasons: [],
				tid,
				adjustedTicketPrice,
			});

			// The given ticket price is low enough to fill the stadium
			assert.strictEqual(attendance, stadiumCapacity);

			const adjustedTicketPrice2 = getAdjustedTicketPrice(
				rawTicketPrice + 1,
				playoffs,
			);
			const attendance2 = await getActualAttendance({
				baseAttendance,
				randomize: false,
				stadiumCapacity,
				teamSeasons: [],
				tid,
				adjustedTicketPrice: adjustedTicketPrice2,
			});

			// Raising the ticket price by just $1 will not fill the stadium
			assert(attendance2 < stadiumCapacity);
		}
	});
});
