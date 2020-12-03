import { PLAYER } from "../../common";
import type { ViewInput } from "../../common/types";
import { idb } from "../db";
import { g } from "../util";

const updateAwards = async (inputs: ViewInput<"editAwards">) => {
	if (!g.get("godMode")) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			errorMessage: "You can't edit awards unless you enable God Mode.",
		};
		return returnValue;
	}
	const season = inputs.season;
	const awards = await idb.getCopy.awards({
		season,
	});

	let playersAll;
	if (g.get("season") === season) {
		playersAll = await idb.cache.players.getAll();
		playersAll = playersAll.filter(p => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
	} else {
		playersAll = await idb.getCopies.players({
			activeSeason: season,
		});
	}
	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"firstName",
			"tid",
			"abbrev",
			"draft",
			"injury",
			"born",
			"watch",
		],
		ratings: ["pos", "season", "ovr", "dovr", "pot", "skills"],
		stats:
			process.env.SPORT === "basketball"
				? [
						"gp",
						"gs",
						"min",
						"pts",
						"trb",
						"ast",
						"blk",
						"stl",
						"per",
						"ewa",
						"ws",
						"dws",
						"ws48",
						"season",
						"abbrev",
						"tid",
						"jerseyNumber",
				  ]
				: [
						"keyStats",
						"av",
						"pntYds",
						"fg",
						"krTD",
						"krYds",
						"prTD",
						"prYds",
						"season",
						"abbrev",
						"tid",
						"jerseyNumber",
				  ],
		fuzz: true,
		mergeStats: true,
	});

	for (const p of players) {
		p.pos = p.ratings[p.ratings.length - 1].pos;

		p.currentStats = p.stats[p.stats.length - 1];
		for (let i = p.stats.length - 1; i >= 0; i--) {
			if (p.stats[i].season === season) {
				p.currentStats = p.stats[i];
				break;
			}
		}

		// Otherwise it's always the current season
		p.age = season - p.born.year;
	}
	const nobody: any = {
		pid: undefined,
		name: "Nobody",
		currentStats: undefined,
		tid: undefined,
		abbrev: undefined,
	};
	players.splice(0, 0, nobody);
	return {
		godMode: g.get("godMode"),
		players,
		awards,
		season,
	};
};
export default updateAwards;
