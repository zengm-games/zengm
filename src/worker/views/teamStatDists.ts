import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updateTeams = async (
	inputs: ViewInput<"teamStatDists">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			(updateEvents.includes("gameSim") ||
				updateEvents.includes("playerMovement"))) ||
		inputs.season !== state.season
	) {
		const teams = await idb.getCopies.teamsPlus({
			seasonAttrs: ["won", "lost"],
			stats: [
				"fg",
				"fga",
				"fgp",
				"tp",
				"tpa",
				"tpp",
				"ft",
				"fta",
				"ftp",
				"orb",
				"drb",
				"trb",
				"ast",
				"tov",
				"stl",
				"blk",
				"pf",
				"pts",
				"oppPts",
			],
			season: inputs.season,
		});

		type Keys =
			| keyof typeof teams[number]["seasonAttrs"]
			| keyof typeof teams[number]["stats"];
		type StatsAll = Record<Keys, number[]>;
		const statsAll = (teams.reduce((memo: any, t) => {
			for (const cat of ["seasonAttrs", "stats"] as const) {
				for (const stat of helpers.keys(t[cat])) {
					if (memo.hasOwnProperty(stat)) {
						memo[stat].push(t[cat][stat]);
					} else {
						memo[stat] = [t[cat][stat]];
					}
				}
			}

			return memo;
		}, {}) as never) as StatsAll;

		return {
			season: inputs.season,
			statsAll,
		};
	}
};

export default updateTeams;
