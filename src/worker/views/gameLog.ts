import { idb } from "../db";
import { g, getProcessedGames, helpers } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	AllStars,
	Game,
} from "../../common/types";

export const setTeamInfo = async (
	t: any,
	i: number,
	allStars: AllStars | undefined,
	game: any,
) => {
	if (allStars) {
		const ind = t.tid === -1 ? 0 : 1;
		t.region = "Team";
		t.name = allStars.teamNames[ind].replace("Team ", "");
		t.abbrev = t.name.slice(0, 3).toUpperCase();
		t.imgURL = "";

		if (i === 1 && t.abbrev === game.teams[0].abbrev) {
			t.abbrev = `${t.abbrev.slice(0, 2)}2`;
		}

		for (const p of t.players) {
			const entry = allStars.teams[ind].find(p2 => p2.pid === p.pid);
			p.abbrev = entry ? g.get("teamInfoCache")[entry.tid]?.abbrev : "";
			p.tid = entry ? entry.tid : g.get("userTid");
		}
	} else {
		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[t.tid, game.season],
		);
		if (teamSeason) {
			t.region = teamSeason.region || g.get("teamInfoCache")[t.tid]?.region;
			t.name = teamSeason.name || g.get("teamInfoCache")[t.tid]?.name;
			t.abbrev = teamSeason.abbrev || g.get("teamInfoCache")[t.tid]?.abbrev;
			t.imgURL = teamSeason.imgURL || g.get("teamInfoCache")[t.tid]?.imgURL;
			t.colors = teamSeason.colors;
		} else {
			t.region = g.get("teamInfoCache")[t.tid]?.region;
			t.name = g.get("teamInfoCache")[t.tid]?.name;
			t.abbrev = g.get("teamInfoCache")[t.tid]?.abbrev;
			t.imgURL = g.get("teamInfoCache")[t.tid]?.imgURL;
		}
	}

	for (const p of t.players) {
		const p2 = await idb.cache.players.get(p.pid);
		if (p2) {
			p.watch = p2.watch;
		}
	}
};

/**
 * Generate a box score.
 *
 * @memberOf views.gameLog
 * @param {number} gid Integer game ID for the box score (a negative number means no box score).
 * @return {Promise.Object} Resolves to an object containing the box score data (or a blank object).
 */
const boxScore = async (gid: number) => {
	let game = helpers.deepCopy(await idb.cache.games.get(gid)); // Only this season is in cache

	if (!game) {
		const game2 = await idb.league.get("games", gid);
		if (game2) {
			game = game2;
		}
	}

	// If game doesn't exist (bad gid or deleted box scores), show nothing
	if (!game) {
		return { gid: -1 };
	}

	const allStarGame = game.teams[0].tid === -1 || game.teams[1].tid === -1;
	let allStars: AllStars | undefined;

	if (allStarGame) {
		allStars = await idb.getCopy.allStars({
			season: game.season,
		});

		if (!allStars) {
			return { gid: -1 };
		}
	}

	for (let i = 0; i < game.teams.length; i++) {
		const t = game.teams[i];
		await setTeamInfo(t, i, allStars, game);

		// Floating point errors make this off a bit
		t.min = Math.round(t.min);

		// Put injured players at the bottom, then sort by GS and roster position
		t.players.sort((a: any, b: any) => {
			// This sorts by starters first and minutes second, since .min is always far less than 1000 and gs is either 1 or 0. Then injured players are listed at the end, if they didn't play.
			return (
				b.gs * 100000 +
				b.min * 1000 -
				b.injury.gamesRemaining -
				(a.gs * 100000 + a.min * 1000 - a.injury.gamesRemaining)
			);
		});
	}

	const wonInd = game.won.tid === game.teams[0].tid ? 0 : 1;
	const lostInd = wonInd === 0 ? 1 : 0;

	let overtime;
	if (game.overtimes === 1) {
		overtime = " (OT)";
	} else if (game.overtimes > 1) {
		overtime = ` (${game.overtimes}OT)`;
	} else {
		overtime = "";
	}

	if (game.numPeriods === undefined) {
		game.numPeriods = 4;
	}

	const game2 = {
		...game,
		overtime,

		// WARNING - won/lost . region/name/abbrev is used to distinguish between GameLog and LiveGame in BoxScore, so be careful if you change this!
		won: {
			...game.won,
			region: game.teams[wonInd].region,
			name: game.teams[wonInd].name,
			abbrev: game.teams[wonInd].abbrev,
			imgURL: game.teams[wonInd].imgURL,
			won: game.teams[wonInd].won,
			lost: game.teams[wonInd].lost,
			tied: game.teams[wonInd].tied,
			otl: game.teams[wonInd].otl,
			playoffs: game.teams[wonInd].playoffs,
		},
		lost: {
			...game.lost,
			region: game.teams[lostInd].region,
			name: game.teams[lostInd].name,
			abbrev: game.teams[lostInd].abbrev,
			imgURL: game.teams[lostInd].imgURL,
			won: game.teams[lostInd].won,
			lost: game.teams[lostInd].lost,
			tied: game.teams[lostInd].tied,
			otl: game.teams[lostInd].otl,
			playoffs: game.teams[lostInd].playoffs,
		},
	};

	// Swap teams order, so home team is at bottom in box score
	game2.teams.reverse();

	if (game2.scoringSummary) {
		for (const event of game2.scoringSummary) {
			event.t = event.t === 0 ? 1 : 0;
		}
	}

	return game2;
};

const updateTeamSeason = async (inputs: ViewInput<"gameLog">) => {
	return {
		// Needed for dropdown
		abbrev: inputs.abbrev,
		currentSeason: g.get("season"),
		season: inputs.season,
		tid: g.get("teamInfoCache").findIndex(t => t.abbrev === inputs.abbrev),
	};
};

/**
 * Update the displayed box score, as necessary.
 *
 * If the box score is already loaded, nothing is done.
 *
 * @memberOf views.gameLog
 * @param {number} inputs.gid Integer game ID for the box score (a negative number means no box score).
 */
const updateBoxScore = async (
	{ gid }: ViewInput<"gameLog">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		!state.boxScore ||
		gid !== state.boxScore.gid
	) {
		const game = await boxScore(gid);
		return { boxScore: game };
	}
};

/**
 * Update the game log list, as necessary.
 *
 * If the game log list is already loaded, nothing is done. If the game log list is loaded and a new game has been played, update. If the game log list is not loaded, load it.
 *
 * @memberOf views.gameLog
 * @param {string} inputs.abbrev Abbrev of the team for the list of games.
 * @param {number} inputs.season Season for the list of games.
 * @param {number} inputs.gid Integer game ID for the box score (a negative number means no box score), which is used only for highlighting the relevant entry in the list.
 */
const updateGamesList = async (
	{ abbrev, season }: ViewInput<"gameLog">,
	updateEvents: UpdateEvents,
	state: {
		gamesList?: {
			games: Game[];
			abbrev: string;
			season: number;
		};
	},
) => {
	if (
		updateEvents.includes("firstRun") ||
		!state.gamesList ||
		abbrev !== state.gamesList.abbrev ||
		season !== state.gamesList.season ||
		(updateEvents.includes("gameSim") && season === g.get("season"))
	) {
		let games: Game[];

		if (
			state.gamesList &&
			(abbrev !== state.gamesList.abbrev || season !== state.gamesList.season)
		) {
			// Switching to a new list
			games = [];
		} else {
			games = state.gamesList ? state.gamesList.games : [];
		}

		const newGames = await getProcessedGames({
			abbrev,
			season,
			loadedGames: games,
		});

		if (games.length === 0) {
			games = newGames;
		} else {
			for (let i = newGames.length - 1; i >= 0; i--) {
				games.unshift(newGames[i]);
			}
		}

		return {
			gamesList: {
				games,
				abbrev,
				season,
			},
		};
	}
};

export default async (
	inputs: ViewInput<"gameLog">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	return Object.assign(
		{},
		await updateBoxScore(inputs, updateEvents, state),
		await updateGamesList(inputs, updateEvents, state),
		await updateTeamSeason(inputs),
	);
};
