import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, AllStars } from "../../common/types";

const addAbbrev = (obj: any): any => {
	return { ...obj, abbrev: g.get("teamInfoCache")[obj.tid]?.abbrev };
};

const augment = (allAllStars: AllStars[]) => {
	return allAllStars.map(row => {
		return {
			gid: row.gid,
			mvp: row.mvp ? addAbbrev(row.mvp) : undefined,
			overtimes: row.overtimes,
			score: row.score,
			season: row.season,
			teamNames: row.teamNames,
			captain1: addAbbrev(row.teams[0][0]),
			captain2: addAbbrev(row.teams[1][0]),
		};
	});
};

const updateAllStarHistory = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const allAllStars = await idb.getCopies.allStars();
		return {
			allAllStars: augment(allAllStars),
			userTid: g.get("userTid"),
		};
	}
};

export default updateAllStarHistory;
