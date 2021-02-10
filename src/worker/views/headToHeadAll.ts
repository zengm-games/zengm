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
		const gpByTid = new Map<number, number>();

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

				const gp = info.won + info.lost + info.otl + info.tied;
				for (const tid2 of [info.tid, info.tid2]) {
					gpByTid.set(tid2, (gpByTid.get(tid2) ?? 0) + gp);
				}
			},
		);

		const teams = orderBy(
			g.get("teamInfoCache").map((t, tid) => ({
				tid,
				abbrev: t.abbrev,
				name: t.name,
				region: t.region,
				disabled: t.disabled,
			})),
			"abbrev",
		).filter(t => {
			// For old seasons, don't include teams that didn't exist yet
			const gp = gpByTid.get(t.tid) ?? 0;
			return gp > 0;
		});

		for (const infoByTid of infoByTidByTid.values()) {
			for (const info of infoByTid.values()) {
				info.winp = helpers.calcWinp(info);
			}
		}

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
