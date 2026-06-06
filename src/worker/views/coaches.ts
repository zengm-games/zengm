import { PLAYER } from "../../common/constants.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents } from "../../common/types.ts";

const updateCoaches = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement") ||
		updateEvents.includes("newPhase")
	) {
		const season = g.get("season");
		const teams = await idb.cache.teams.getAll();
		const teamInfo = new Map(
			teams.map((t) => [
				t.tid,
				{ abbrev: t.abbrev, region: t.region, name: t.name },
			]),
		);

		const allCoaches = await idb.cache.coaches.getAll();

		const coaches = await Promise.all(
			allCoaches.map(async (c) => {
				const info = teamInfo.get(c.tid);

				// Current-season record + expected wins for employed coaches.
				let won;
				let expectedWins;
				if (c.tid >= 0) {
					const ts = await idb.cache.teamSeasons.indexGet(
						"teamSeasonsByTidSeason",
						[c.tid, season],
					);
					if (ts) {
						won = ts.won;
						expectedWins = ts.expectedWins;
					}
				}

				return {
					cid: c.cid,
					firstName: c.firstName,
					lastName: c.lastName,
					age: season - c.born.year,
					tid: c.tid,
					abbrev: info?.abbrev,
					region: info?.region,
					name: info?.name,
					ratings: c.ratings,
					philosophy: c.philosophy,
					contract: c.contract,
					fromPid: c.fromPid,
					awards: c.awards,
					numAwards: c.awards.length,
					won,
					expectedWins,
				};
			}),
		);

		coaches.sort((a, b) => {
			// Employed coaches first (by team), then free agents by ovr.
			if (a.tid >= 0 && b.tid < 0) {
				return -1;
			}
			if (a.tid < 0 && b.tid >= 0) {
				return 1;
			}
			if (a.tid >= 0 && b.tid >= 0) {
				return a.tid - b.tid;
			}
			return b.ratings.ovr - a.ratings.ovr;
		});

		return {
			coaches,
			userTid: g.get("userTid"),
			userTids: g.get("userTids"),
			freeAgent: PLAYER.FREE_AGENT,
			godMode: g.get("godMode"),
			spectator: g.get("spectator"),
			phase: g.get("phase"),
			season,
		};
	}
};

export default updateCoaches;
