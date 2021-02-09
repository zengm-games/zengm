import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { headToHead, team } from "../core";

const updateHeadToHead = async (
	{ abbrev, season, tid }: ViewInput<"headToHead">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	console.log(abbrev, season, state);
	if (
		(season === g.get("season") && updateEvents.includes("gameSim")) ||
		season !== state.season ||
		abbrev !== state.abbrev
	) {
		type TeamInfo = {
			won: number;
			lost: number;
			tied: number;
			otl: number;
			winp: number;
			pts: number;
			oppPts: number;
			seriesWon: number;
			seriesLost: number;
		};

		const infoByTid = new Map<number, TeamInfo>();

		await headToHead.iterateSeasons(
			{
				tid,
				type: "combined",
			},
			info => {},
		);

		const teams: ({
			region: string;
			name: string;
			abbrev: string;
			tid: number;
		} & TeamInfo)[] = [];

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
			ties: g.get("ties", season) || ties,
			otl: g.get("otl", season) || otl,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHeadToHead;
