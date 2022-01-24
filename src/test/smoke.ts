import { league } from "../worker/core";
import { connectMeta, idb } from "../worker/db";
import { defaultGameAttributes, g, local } from "../worker/util";

import "smoke-test-overrides"; // eslint-disable-line
import { deleteDB } from "idb";
import createStreamFromLeagueObject from "../worker/core/league/create/createStreamFromLeagueObject";
import { helpers, MAX_SUPPORTED_LEAGUE_VERSION } from "../common";

describe("Smoke Tests", () => {
	let intervalID: number;

	it("Create a new league and simuluate a season without error", async function () {
		// Don't want to include Mocha and Jest types cause they conflict
		// @ts-expect-error
		this.timeout(5 * 60 * 1000); // 5 minutes

		idb.meta = await connectMeta();
		const stream = createStreamFromLeagueObject({});

		await league.createStream(stream, {
			confs: defaultGameAttributes.confs.at(-1).value,
			divs: defaultGameAttributes.divs.at(-1).value,
			fromFile: {
				gameAttributes: undefined,
				hasRookieContracts: true,
				maxGid: undefined,
				startingSeason: undefined,
				teams: undefined,
				version: MAX_SUPPORTED_LEAGUE_VERSION,
			},
			getLeagueOptions: undefined,
			keptKeys: new Set(),
			lid: 0,
			name: "Test",
			setLeagueCreationStatus: () => {},
			settings: {} as any,
			shuffleRosters: false,
			startingSeasonFromInput: "2016",
			teamsFromInput: helpers.addPopRank(helpers.getTeamsDefault()),
			tid: 0,
		});
		local.autoPlayUntil = {
			season: 2017,
			phase: 0,
			start: Date.now(),
		};
		league.autoPlay();
		return new Promise(resolve => {
			intervalID = window.setInterval(() => {
				if (g.get("season") === 2017) {
					clearInterval(intervalID); // Wait to let it finish whatever DB activity might still be ongoing (like flushing cache)

					setTimeout(resolve, 5000);
				}
			}, 500);
		});
	});

	// Don't want to include Mocha and Jest types cause they conflict
	// @ts-expect-error
	after(async () => {
		clearInterval(intervalID);
		await league.remove(g.get("lid"));

		if (g.get("lid") !== undefined) {
			throw new Error("g.lid should be undefined");
		}

		if (idb.meta !== undefined) {
			idb.meta.close();
		}

		await deleteDB("meta");
		// @ts-expect-error
		idb.meta = undefined;
	});
});
