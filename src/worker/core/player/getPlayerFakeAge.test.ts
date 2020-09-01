import assert from "assert";
import testHelpers from "../../../test/helpers";
import player from "./index";
import { g } from "../../util";

describe("worker/core/player/getPlayerFakeAge", () => {
	test("pick appropriate player to have a fake age", () => {
		testHelpers.resetG();
		const players: any = [
			player.generate(0, 19, g.get("season"), false, 15.5),
			player.generate(0, 25, g.get("season"), false, 15.5), // Should get filtered out, too old
			player.generate(0, 22, g.get("season"), false, 15.5),
			player.generate(0, 20, g.get("season"), false, 15.5),
		];
		players[0].pid = 0;
		players[0].born.loc = "Ghana";
		players[1].pid = 1;
		players[1].born.loc = "Ghana";
		players[2].pid = 2;
		players[2].born.loc = "USA";
		players[3].pid = 3;
		players[3].born.loc = "Egypt";
		const pidCounts = {
			"0": 0,
			"1": 0,
			"2": 0,
			"3": 0,
		};

		for (let i = 0; i < 1000; i++) {
			const p = player.getPlayerFakeAge(players);

			if (p === undefined) {
				throw new Error(
					"p should not be undefined because there should be valid players to pick",
				);
			}

			// @ts-ignore
			pidCounts[p.pid] += 1;
		}

		// 40/81
		assert(
			pidCounts[0] >= 100,
			`Player 0 picked ${pidCounts[0]} times, should be more than 100`,
		);

		// 1/81
		assert.strictEqual(pidCounts[1], 0); // 0/81

		assert(
			pidCounts[2] > 0 && pidCounts[2] < 100,
			`Player 2 picked ${pidCounts[2]} times, should be between 0 and 100`,
		);

		// 40/81
		assert(
			pidCounts[3] >= 100,
			`Player 3 picked ${pidCounts[3]} times, should be more than 100`,
		);
	});
});
