import {
	bySport,
	isSport,
	PHASE,
	PLAYER,
	RATINGS,
	REMAINING_PLAYOFF_TEAMS_PHASES,
} from "../../common/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type {
	PlayInTournament,
	PlayoffSeries,
	PlayoffSeriesTeam,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { buffOvrDH } from "./depth.ts";
import { actualPhase } from "../util/actualPhase.ts";
import { season } from "../core/index.ts";

export const extraRatings = bySport({
	baseball: ["ovrs", "pots"],
	basketball: [],
	football: ["ovrs", "pots"],
	hockey: ["ovrs", "pots"],
});

const getActivePlayoffTids = async () => {
	const tids = new Set<number>();
	const phase = actualPhase();
	if (!REMAINING_PLAYOFF_TEAMS_PHASES.has(phase)) {
		return tids;
	}

	let series: PlayoffSeries["series"];
	let playIns: PlayoffSeries["playIns"];

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	let currentRound;
	if (playoffSeries) {
		series = playoffSeries.series;
		playIns = playoffSeries.playIns;
		currentRound = playoffSeries.currentRound;
	} else {
		const result = await season.genPlayoffSeries();
		series = result.series;
		playIns = result.playIns;
		currentRound = playIns ? -1 : 0;
	}

	let actualCurrentRound;
	if (currentRound === -1 && playIns) {
		const saveMatchupBoth = (matchup: PlayInTournament[0]) => {
			tids.add(matchup.away.tid);
			tids.add(matchup.home.tid);
		};
		const saveMatchupWinner = (matchup: PlayInTournament[0]) => {
			if (matchup.away.won === 1) {
				tids.add(matchup.away.tid);
			} else if (matchup.home.won === 1) {
				tids.add(matchup.home.tid);
			}
		};
		const saveMatchupWinnerOrBoth = (matchup: PlayInTournament[0]) => {
			if (matchup.away.won === 0 && matchup.home.won === 0) {
				tids.add(matchup.away.tid);
				tids.add(matchup.home.tid);
			} else if (matchup.away.won === 1) {
				tids.add(matchup.away.tid);
			} else if (matchup.home.won === 1) {
				tids.add(matchup.home.tid);
			}
		};

		for (const playIn of playIns) {
			const game78 = playIn[0];
			const game910 = playIn[1];
			const gameFinal = playIn[2];

			if (gameFinal) {
				// First round of play-in has happened, so take the winner of game78 and the winner (or both if it hasn't happened yet) of gameFinal
				saveMatchupWinner(game78);
				saveMatchupWinnerOrBoth(gameFinal);
			} else {
				// First round of play-in is ongoing, so both teams from game78 are still alive and only the winner (or both if it hasn't happened yet) of game910
				saveMatchupBoth(game78);
				saveMatchupWinnerOrBoth(game910);
			}
		}
		actualCurrentRound = 0;
	} else {
		actualCurrentRound = currentRound;
	}

	const matchups = series[actualCurrentRound];
	const numGamesInRound =
		g.get("numGamesPlayoffSeries", "current")[actualCurrentRound] ?? Infinity;
	if (matchups) {
		const saveTid = (t: PlayoffSeriesTeam) => {
			if (!t.pendingPlayIn) {
				tids.add(t.tid);
			}
		};

		// Save any teams that have won their series, or are in a series that is not over yet
		for (const matchup of matchups) {
			if (!matchup.away) {
				saveTid(matchup.home);
			} else {
				if (matchup.away.won >= numGamesInRound) {
					saveTid(matchup.away);
				} else if (matchup.home.won >= numGamesInRound) {
					saveTid(matchup.home);
				} else {
					saveTid(matchup.away);
					saveTid(matchup.home);
				}
			}
		}
	}

	return tids;
};

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
		playersAll = playersAll.filter((p) => p.tid !== PLAYER.RETIRED); // Normally won't be in cache, but who knows...
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
		playersAll = playersAll.filter((p) => p.watch);
	}

	// Show only playoff teamas
	if (tid === undefined && abbrev === "playoffs") {
		const playoffTids = await getActivePlayoffTids();
		playersAll = playersAll.filter((p) => playoffTids.has(p.tid));
	}

	// showNoStats for current season (so draft picks etc show up on their correct team) or for no team (so free agents show up)
	const showNoStats = season === g.get("season") || tid === undefined;

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"firstName",
			"lastName",
			"age",
			"contract",
			"injury",
			"hof",
			"watch",
			"tid",
			"abbrev",
			"draft",
			"awards",
			...attrs,
		],
		ratings: ["ovr", "pot", "skills", "pos", ...ratings],
		stats: ["abbrev", "tid", "jerseyNumber", ...stats],
		season,
		showNoStats,
		showRookies: true,
		fuzz: true,
	});

	// idb.getCopies.playersPlus `tid` option doesn't work well enough (factoring in showNoStats and showRookies), so let's do it manually
	// For the current season, use the current abbrev (including FA), not the last stats abbrev
	// For other seasons, use the stats abbrev for filtering
	if (g.get("season") === season) {
		if (tid !== undefined) {
			players = players.filter((p) => p.tid === tid);
		}

		for (const p of players) {
			p.stats.abbrev = p.abbrev;
			p.stats.tid = p.tid;
		}
	} else if (tid !== undefined) {
		players = players.filter((p) => p.stats.tid === tid);
	}

	if (isSport("baseball")) {
		for (const p of players) {
			buffOvrDH(p);
		}
	}

	return players;
};

const updatePlayers = async (
	inputs: ViewInput<"playerRatings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		(inputs.season === g.get("season") &&
			updateEvents.includes("playerMovement")) ||
		(updateEvents.includes("newPhase") && g.get("phase") === PHASE.PRESEASON) ||
		(inputs.abbrev === "playoffs" && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season ||
		inputs.abbrev !== state.abbrev
	) {
		const ratings = bySport({
			baseball: RATINGS,
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

		const players = addFirstNameShort(
			await getPlayers(
				inputs.season,
				inputs.abbrev,
				[],
				[...ratings, ...extraRatings],
				[],
				inputs.tid,
			),
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
