import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { headToHead } from "../core";
import orderBy from "lodash-es/orderBy";
import { PHASE } from "../../common";

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
				gpByTid.set(info.tid, (gpByTid.get(info.tid) ?? 0) + gp);
			},
		);

		let teams = orderBy(
			g.get("teamInfoCache").map((t, tid) => ({
				tid,
				abbrev: t.abbrev,
				name: t.name,
				region: t.region,
				disabled: t.disabled,
			})),
			"abbrev",
		);

		if (season !== "all") {
			const currentSeason = g.get("season");
			if (
				season < currentSeason ||
				(season === currentSeason && g.get("phase") > PHASE.REGULAR_SEASON)
			) {
				// For old seasons, don't include teams that played no games (inactive or didn't exist yet)
				teams = teams.filter(t => {
					const gp = gpByTid.get(t.tid) ?? 0;
					return gp > 0;
				});
			} else if (season === currentSeason) {
				// For current season, don't include inactive teams
				teams = teams.filter(t => !t.disabled);
			}
		}

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
