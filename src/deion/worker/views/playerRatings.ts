import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import { UpdateEvents, ViewInput } from "../../common/types";

const updatePlayers = async (
	inputs: ViewInput<"playerRatings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(inputs.season === g.get("season") &&
			updateEvents.includes("playerMovement")) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		inputs.season !== state.season ||
		inputs.abbrev !== state.abbrev
	) {
		let players;

		if (g.get("season") === inputs.season) {
			players = await idb.cache.players.getAll();
			players = players.filter(p => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
		} else {
			players = await idb.getCopies.players({
				activeSeason: inputs.season,
			});
		}

		let tid: number | undefined = g
			.get("teamAbbrevsCache")
			.indexOf(inputs.abbrev);

		if (tid < 0) {
			tid = undefined;
		}

		// Show all teams
		if (!tid && inputs.abbrev === "watch") {
			players = players.filter(p => p.watch && typeof p.watch !== "function");
		}

		const ratings =
			process.env.SPORT === "basketball"
				? [
						"hgt",
						"stre",
						"spd",
						"jmp",
						"endu",
						"ins",
						"dnk",
						"ft",
						"fg",
						"tp",
						"oiq",
						"diq",
						"drb",
						"pss",
						"reb",
				  ]
				: [
						"hgt",
						"stre",
						"spd",
						"endu",
						"thv",
						"thp",
						"tha",
						"bsc",
						"elu",
						"rtr",
						"hnd",
						"rbk",
						"pbk",
						"pcv",
						"tck",
						"prs",
						"rns",
						"kpw",
						"kac",
						"ppw",
						"pac",
				  ];
		const extraRatings =
			process.env.SPORT === "basketball" ? [] : ["ovrs", "pots"];
		players = await idb.getCopies.playersPlus(players, {
			attrs: [
				"pid",
				"name",
				"abbrev",
				"age",
				"contract",
				"born",
				"injury",
				"hof",
				"watch",
				"tid",
				"college",
			],
			ratings: ["ovr", "pot", "skills", "pos", ...ratings, ...extraRatings],
			stats: ["abbrev", "tid"],
			season: inputs.season,
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		});

		// idb.getCopies.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually		// For the current season, use the current abbrev (including FA), not the last stats abbrev
		// For other seasons, use the stats abbrev for filtering

		if (g.get("season") === inputs.season) {
			if (tid !== undefined) {
				players = players.filter(p => p.abbrev === inputs.abbrev);
			}

			for (const p of players) {
				p.stats.abbrev = p.abbrev;
				p.stats.tid = p.tid;
			}
		} else if (tid !== undefined) {
			players = players.filter(p => p.stats.abbrev === inputs.abbrev);
		}

		return {
			abbrev: inputs.abbrev,
			currentSeason: g.get("season"),
			season: inputs.season,
			players,
			ratings,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
