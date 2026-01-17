import { afterAll, describe, test } from "vitest";
import { league } from "../worker/core/index.ts";
import { idb } from "../worker/db/index.ts";
import { defaultGameAttributes, g, local } from "../worker/util/index.ts";

import "../worker/index.ts";
import { deleteDB } from "@dumbmatter/idb";
import createStreamFromLeagueObject from "../worker/core/league/create/createStreamFromLeagueObject.ts";
import { helpers, LEAGUE_DATABASE_VERSION } from "../common/index.ts";

describe("Smoke Tests", () => {
	let intervalID: number;

	const timeout = 5 * 60 * 1000; // 5 minutes;

	test(
		"Create a new league and simuluate a season without error",
		{ timeout },
		async () => {
			const stream = createStreamFromLeagueObject({});

			await league.createStream(stream, {
				confs: defaultGameAttributes.confs.at(-1)!.value,
				divs: defaultGameAttributes.divs.at(-1)!.value,
				fromFile: {
					gameAttributes: undefined,
					hasRookieContracts: true,
					maxGid: undefined,
					startingSeason: undefined,
					teams: undefined,
					version: LEAGUE_DATABASE_VERSION,
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
			return new Promise((resolve) => {
				intervalID = window.setInterval(() => {
					if (g.get("season") === 2017) {
						clearInterval(intervalID);

						// Wait to let it finish whatever DB activity might still be ongoing (like flushing cache)
						setTimeout(resolve, 5000);
					}
				}, 500);
			});
		},
	);

	afterAll(async () => {
		clearInterval(intervalID);
		await league.remove(g.get("lid"));

		if (g.get("lid") !== undefined) {
			throw new Error("g.lid should be undefined");
		}

		await idb.meta.close();
		await deleteDB("meta");
	});
});
