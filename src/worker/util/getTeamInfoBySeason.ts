import { DEFAULT_JERSEY, DEFAULT_TEAM_COLORS } from "../../common/index.ts";
import { idb } from "../db/index.ts";

const getTeamInfoBySeason = async (tid: number, season: number) => {
	if (tid === -1 || tid === -2) {
		return {
			abbrev: "ASG",
			colors: DEFAULT_TEAM_COLORS,
			jersey: DEFAULT_JERSEY,
			name: tid === -1 ? "1" : "2",
			region: "All-Stars",
		};
	}

	const teamSeasonsIndex = idb.league
		.transaction("teamSeasons")
		.store.index("tid, season");

	let ts:
		| {
				abbrev: string;
				colors: [string, string, string];
				jersey?: string;
				name: string;
				region: string;
		  }
		| undefined = await teamSeasonsIndex.get([tid, season]);
	if (!ts) {
		// No team season entry for the requested season... is there an older one, somehow? If so, use the latest one before the requested season. If not, use the first we find (it is the oldest existing one, so assume that applies).
		let cursor = await teamSeasonsIndex.openCursor(
			IDBKeyRange.bound([tid, -Infinity], [tid, Infinity]),
		);
		while (cursor) {
			if (cursor.value.season > season && ts) {
				break;
			}
			ts = cursor.value;
			cursor = await cursor.continue();
		}
	}
	if (!ts) {
		ts = await idb.cache.teams.get(tid);
	}

	if (ts) {
		return {
			abbrev: ts.abbrev,
			colors: ts.colors ?? DEFAULT_TEAM_COLORS,
			jersey: ts.jersey,
			name: ts.name,
			region: ts.region,
		};
	}

	// Could be an invalid tid, like PLAYER.TOT or PLAYER.DOES_NOT_EXIST
};

export default getTeamInfoBySeason;
