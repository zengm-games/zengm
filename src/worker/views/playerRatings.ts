import { PHASE, PLAYER } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

export const getPlayers = async (
	season: number,
	abbrev: string,
	attrs: string[],
	ratings: string[],
	stats: string[],
	tid: number | undefined,
) => {
	let playersAll;

	if (g.get("season") === season) {
		playersAll = await idb.cache.players.getAll();
		playersAll = playersAll.filter(p => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
	} else {
		playersAll = await idb.getCopies.players({
			activeSeason: season,
		});
	}

	// Show all teams
	if (tid === undefined && abbrev === "watch") {
		playersAll = playersAll.filter(
			p => p.watch && typeof p.watch !== "function",
		);
	}

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"age",
			"contract",
			"injury",
			"hof",
			"watch",
			"tid",
			"abbrev",
			...attrs,
		],
		ratings: ["ovr", "pot", "skills", "pos", ...ratings],
		stats: ["abbrev", "tid", "jerseyNumber", ...stats],
		season: season,
		showNoStats: true,
		showRookies: true,
		fuzz: true,
	});

	// idb.getCopies.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
	// For the current season, use the current abbrev (including FA), not the last stats abbrev
	// For other seasons, use the stats abbrev for filtering
	if (g.get("season") === season) {
		if (tid !== undefined) {
			players = players.filter(p => p.tid === tid);
		}

		for (const p of players) {
			p.stats.abbrev = p.abbrev;
			p.stats.tid = p.tid;
		}
	} else if (tid !== undefined) {
		players = players.filter(p => p.stats.tid === tid);
	}

	return players;
};

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

		const players = await getPlayers(
			inputs.season,
			inputs.abbrev,
			[],
			[...ratings, ...extraRatings],
			[],
			inputs.tid,
		);

		return {
			abbrev: inputs.abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			season: inputs.season,
			players,
			ratings,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
