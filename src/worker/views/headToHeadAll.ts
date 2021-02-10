import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { headToHead } from "../core";
import orderBy from "lodash/orderBy";

const updateHeadToHeadAll = async (
	{ season, type }: ViewInput<"headToHeadAll">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		((season === g.get("season") || season === "all") &&
			updateEvents.includes("gameSim")) ||
		season !== state.season ||
		type !== state.type
	) {
		const simpleSums = ["won", "lost", "tied", "otl"] as const;
		type TeamInfo = Record<typeof simpleSums[number], number> & {
			winp: number;
		};

		const infoByTidByTid = new Map<number, Map<number, TeamInfo>>();

		await headToHead.iterate(
			{
				tid: "all",
				type,
				season,
			},
			info => {
				let infoByTid = infoByTidByTid.get(info.tid2);
				if (!infoByTid) {
					infoByTid = new Map();
					infoByTidByTid.set(info.tid2, infoByTid);
				}
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

		const teams = orderBy(
			g.get("teamInfoCache").map((t, tid) => ({
				tid,
				abbrev: t.abbrev,
				name: t.name,
				region: t.region,
			})),
			"abbrev",
		);

		for (const infoByTid of infoByTidByTid.values()) {
			for (const info of infoByTid.values()) {
				info.winp = helpers.calcWinp(info);
			}
		}

		console.log(teams, infoByTidByTid);

		return {
			infoByTidByTid,
			season,
			teams,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updateHeadToHeadAll;
