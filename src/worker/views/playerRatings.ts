import { bySport, isSport, PHASE, PLAYER, POSITIONS } from "../../common";
import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { TableConfig } from "../../ui/util/TableConfig";

export const getPlayers = async (
	season: number,
	abbrev: string,
	attrs: string[],
	ratings: string[],
	stats: string[],
	tid: number | undefined,
	config: TableConfig,
) => {
	let playersAll;

	if (g.get("season") === season) {
		playersAll = await idb.cache.players.getAll();
		playersAll = playersAll.filter(p => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
	} else {
		playersAll = await idb.getCopies.players(
			{
				activeSeason: season,
			},
			"noCopyCache",
		);
	}

	// Show all teams
	if (tid === undefined && abbrev === "watch") {
		playersAll = playersAll.filter(p => p.watch);
	}

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: config.attrsNeeded,
		ratings: config.ratingsNeeded,
		stats: config.statsNeeded,
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
		updateEvents.includes("customizeTable") ||
		(inputs.season === g.get("season") &&
			updateEvents.includes("playerMovement")) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		inputs.season !== state.season ||
		inputs.abbrev !== state.abbrev
	) {
		const ratings = bySport({
			basketball: [
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
			],
			football: [
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
			],
			hockey: [
				"hgt",
				"stre",
				"spd",
				"endu",
				"pss",
				"wst",
				"sst",
				"stk",
				"oiq",
				"chk",
				"blk",
				"fcf",
				"diq",
				"glk",
			],
		});
		const extraRatings = bySport({
			basketball: [],
			football: ["ovrs", "pots"],
			hockey: ["ovrs", "pots"],
		});

		const ovrsPotsColNames: string[] = [];
		if (isSport("football") || isSport("hockey")) {
			for (const pos of POSITIONS) {
				for (const type of ["ovr", "pot"]) {
					ovrsPotsColNames.push(`rating:${type}${pos}`);
				}
			}
		}

		const config: TableConfig = new TableConfig("playerRatings", [
			"Name",
			"Pos",
			"Team",
			"Age",
			"Contract",
			"Exp",
			"Ovr",
			"Pot",
			...ratings.map(rating => `rating:${rating}`),
			...ovrsPotsColNames,
		]);
		await config.load();
		console.log(config);

		const players = await getPlayers(
			inputs.season,
			inputs.abbrev,
			[],
			[...ratings, ...extraRatings],
			[],
			inputs.tid,
			config,
		);

		return {
			abbrev: inputs.abbrev,
			challengeNoRatings: g.get("challengeNoRatings"),
			currentSeason: g.get("season"),
			season: inputs.season,
			players,
			config,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
