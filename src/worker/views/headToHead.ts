import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { headToHead } from "../core";

const updateHeadToHead = async (
	{ abbrev, season, tid, type }: ViewInput<"headToHead">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		((season === g.get("season") || season === "all") &&
			updateEvents.includes("gameSim")) ||
		season !== state.season ||
		abbrev !== state.abbrev ||
		type !== state.type
	) {
		const simpleSums = [
			"won",
			"lost",
			"tied",
			"otl",
			"pts",
			"oppPts",
			"seriesWon",
			"seriesLost",
			"finalsWon",
			"finalsLost",
		] as const;
		type TeamInfo = Record<typeof simpleSums[number], number> & {
			tid: number;
			winp: number;
		};

		const infoByTid = new Map<number, TeamInfo>();

		await headToHead.iterate(
			{
				tid,
				type,
				season,
			},
			info => {
				const current = infoByTid.get(info.tid);
				if (current) {
					for (const key of simpleSums) {
						current[key] += info[key];
					}
				} else {
					infoByTid.set(info.tid, {
						...info,
						winp: 0,
					});
				}
			},
		);

		const teams: ({
			region: string;
			name: string;
			abbrev: string;
			tid: number;
		} & TeamInfo)[] = [];

		const teamInfoCache = g.get("teamInfoCache");

		for (const info of infoByTid.values()) {
			teams.push({
				...info,
				region: teamInfoCache[info.tid].region,
				name: teamInfoCache[info.tid].name,
				abbrev: teamInfoCache[info.tid].abbrev,
			});
		}

		for (const t of teams) {
			t.winp = helpers.calcWinp(t);
		}

		let ties = false;
		let otl = false;
		for (const t of teams) {
			if (t.tied > 0) {
				ties = true;
			}
			if (t.otl > 0) {
				otl = true;
			}
			if (ties && otl) {
				break;
			}
		}

		return {
			abbrev,
			season,
			teams,
			ties: g.get("ties", season === "all" ? "current" : season) || ties,
			otl: g.get("otl", season === "all" ? "current" : season) || otl,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHeadToHead;
