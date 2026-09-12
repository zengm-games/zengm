import { league } from "../worker/core/index.ts";
import { g, helpers, local } from "../worker/util/index.ts";
import "../worker/index.ts";
import createStreamFromLeagueObject from "../worker/core/league/create/createStreamFromLeagueObject.ts";
import { LEAGUE_DATABASE_VERSION, PHASE } from "../common/constants.ts";
import { getDefaultSettings } from "../worker/views/newLeague.ts";
import { last } from "../common/utils.ts";
import { defaultGameAttributes } from "../common/defaultGameAttributes.ts";
import { deleteDB } from "@dumbmatter/idb";
import { idb } from "../worker/db/index.ts";

export const createAndSim = async () => {
	let intervalId: number | undefined;

	try {
		const stream = createStreamFromLeagueObject({});

		await league.createStream(stream, {
			confs: last(defaultGameAttributes.confs).value,
			divs: last(defaultGameAttributes.divs).value,
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
			settings: getDefaultSettings(),
			shuffleRosters: false,
			startingSeasonFromInput: "2016",
			teamsFromInput: helpers.addPopRank(helpers.getTeamsDefault()),
			tid: 0,
		});
		local.autoPlayUntil = {
			season: 2017,
			phase: PHASE.PRESEASON,
			start: Date.now(),
		};
		await league.autoPlay();

		// auto play promise chain gets broken at some point, so we need this
		await new Promise((resolve) => {
			intervalId = setInterval(() => {
				if (g.get("season") === 2017 && local.statusText === "Idle") {
					clearInterval(intervalId);

					// Wait to let it finish whatever DB activity might still be ongoing (like flushing cache)
					setTimeout(resolve, 0);
				}
			}, 100);
		});
	} finally {
		clearInterval(intervalId);
	}
};

export const cleanup = async () => {
	await league.remove(g.get("lid"));

	if (g.get("lid") !== undefined) {
		throw new Error("g.lid should be undefined");
	}

	await idb.meta.close();
	await deleteDB("meta");
};
