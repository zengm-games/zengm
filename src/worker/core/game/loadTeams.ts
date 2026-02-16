import { allStar, player, season, team } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import type {
	Player,
	MinimalPlayerRatings,
	Conditions,
} from "../../../common/types.ts";
import {
	bySport,
	COMPOSITE_WEIGHTS,
	DEFAULT_PLAY_THROUGH_INJURIES,
	isSport,
	PHASE,
} from "../../../common/index.ts";
import playThroughInjuriesFactor from "../../../common/playThroughInjuriesFactor.ts";
import statsRowIsCurrent from "../player/statsRowIsCurrent.ts";

const MAX_NUM_PLAYERS_PACE = 7;

const SKIP_PLAYER_STATS = new Set(["minAvailable"]);

// Is this a game 7, or an elimination game 7 (generalized to other playoff series lengths than 7)
export const isGame6EliminationGameOrGame7 = async (
	playoffs: boolean,
	tid: number,
) => {
	if (!playoffs) {
		return false;
	}

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	if (playoffSeries) {
		if (playoffSeries.currentRound === -1) {
			return true;
		}

		const roundSeries = playoffSeries.series[playoffSeries.currentRound];
		const numGames = g.get("numGamesPlayoffSeries", "current")[
			playoffSeries.currentRound
		];
		if (roundSeries !== undefined && numGames !== undefined) {
			for (const series of roundSeries) {
				if (
					series.away?.tid !== undefined &&
					(tid === series.home.tid || tid === series.away.tid)
				) {
					const numGamesSeries = series.away.won + series.home.won;

					// Game 7?
					if (numGamesSeries === numGames - 1) {
						return true;
					}

					// Elimination game 6?
					if (numGamesSeries === numGames - 2) {
						const eliminationGame =
							series.home.tid === tid
								? series.home.won < series.away.won
								: series.away.won < series.home.won;
						return eliminationGame;
					}
				}
			}
		}
	}

	return false;
};

// Decrease rating by up to 40%
export const getNumConsecutiveGamesGFactor = (
	numConsecutiveGamesG: number,
	playoffs: boolean,
	game6EliminationGameOrGame7: boolean | undefined,
) => {
	const playoffsFactor = playoffs ? (game6EliminationGameOrGame7 ? 4 : 2) : 1;
	return helpers.bound(
		1 - (numConsecutiveGamesG / playoffsFactor) * 0.045,
		0.6,
		1,
	);
};

let playerStats: Record<string, number | number[]>;
let teamStats: Record<string, number>;

export const getActualPlayThroughInjuries = (
	t: { tid: number; playThroughInjuries: [number, number] } | "default",
) => {
	if (t === "default" || g.get("spectator")) {
		return DEFAULT_PLAY_THROUGH_INJURIES;
	}

	if (g.get("userTids").includes(t.tid)) {
		return t.playThroughInjuries;
	}

	return DEFAULT_PLAY_THROUGH_INJURIES;
};

export const processTeam = async (
	teamInput: {
		tid: number;
		playThroughInjuries: [number, number];
		depth?: any;
	},
	teamSeason: {
		won: number;
		lost: number;
		tied: number;
		otl: number;
		cid: number;
		did: number;
	},
	players: Player<MinimalPlayerRatings>[],
	exhibitionGame?: boolean,
) => {
	if (!playerStats) {
		playerStats = {};
		for (const key of player.stats.raw) {
			if (!SKIP_PLAYER_STATS.has(key) && !key.startsWith("opp")) {
				playerStats[key] = 0;
			}
		}
	}

	if (!teamStats) {
		teamStats = {};
		for (const key of team.stats.raw) {
			if (!key.startsWith("opp")) {
				teamStats[key] = 0;
			}
		}
		if (isSport("basketball")) {
			// ba is still recorded as a player stat for some reason, but not a team stat, so we need to add it here so it gets tracked for the box score correctly
			teamStats.ba = 0;
		}
	}

	const allStarGame = teamInput.tid === -1 || teamInput.tid === -2;

	if (!allStarGame) {
		players.sort((a, b) => a.rosterOrder - b.rosterOrder);
	}

	// Initialize team composite rating object
	const compositeRating: any = {};

	if (isSport("basketball")) {
		for (const rating of Object.keys(COMPOSITE_WEIGHTS)) {
			compositeRating[rating] = 0;
		}
	}

	const playoffs = g.get("phase") === PHASE.PLAYOFFS;

	const actualPlayThroughInjuries = getActualPlayThroughInjuries(teamInput);

	// Injury-adjusted ovr
	const playersCurrent = players.map((p) => ({
		pid: p.pid,
		injury: p.injury,
		value: p.value,
		ratings: {
			ovr: player.fuzzRating(p.ratings.at(-1)!.ovr, p.ratings.at(-1)!.fuzz),
			ovrs: player.fuzzOvrs(p.ratings.at(-1)!.ovrs, p.ratings.at(-1)!.fuzz),
			pos: p.ratings.at(-1)!.pos,
		},
	}));
	const ovr = team.ovr(playersCurrent, {
		accountForInjuredPlayers: {
			numDaysInFuture: 0,
			playThroughInjuries: actualPlayThroughInjuries,
		},
		playoffs,
	});

	const t: any = {
		id: teamInput.tid,
		pace: 0,
		won: teamSeason.won,
		lost: teamSeason.lost,
		tied: season.hasTies("current") ? teamSeason.tied : undefined,
		otl: g.get("otl", "current") ? teamSeason.otl : undefined,
		cid: teamSeason.cid,
		did: teamSeason.did,
		ovr,
		stat: {},
		player: [],
		synergy: {
			off: 0,
			def: 0,
			reb: 0,
		},
		compositeRating,
		depth: teamInput.depth,
	};

	const playThroughInjuries = actualPlayThroughInjuries[playoffs ? 1 : 0];

	let game6EliminationGameOrGame7: boolean | undefined;

	for (const p of players) {
		const injuryFactor = playThroughInjuriesFactor(p.injury.gamesRemaining);

		// p.jerseyNumber fallback is for exhibition game players for the current season with no stats
		const jerseyNumber =
			p.stats.length > 0 ? p.stats.at(-1).jerseyNumber : p.jerseyNumber;

		const rating = p.ratings.at(-1)!;
		const playerCompositeRatings: any = {};
		const p2 = {
			id: p.pid,
			pid: p.pid, // for getDepthPlayers, eventually do it all this way
			name: `${p.firstName} ${p.lastName}`,
			age: g.get("season") - p.born.year,
			pos: rating.pos,
			valueNoPot: p.valueNoPot * injuryFactor,
			stat: {} as any,
			compositeRating: playerCompositeRatings,
			skills: rating.skills,
			injury: {
				...p.injury,
				playingThrough:
					p.injury.gamesRemaining > 0 &&
					p.injury.gamesRemaining <= playThroughInjuries,
			},
			injured: p.injury.gamesRemaining > playThroughInjuries,
			jerseyNumber,
			ptModifier: p.ptModifier,
			ovrs: rating.ovrs,
		};

		// Reset ptModifier for AI teams. This should not be necessary since it should always be 1, but let's be safe.
		if (!g.get("userTids").includes(t.id) || g.get("spectator")) {
			p2.ptModifier = 1;
		}
		const seasonStats: Record<string, number> = {};

		// These use the same formulas as the skill definitions in player.skills!
		for (const [k, weightInfo] of Object.entries(COMPOSITE_WEIGHTS)) {
			p2.compositeRating[k] =
				player.compositeRating(
					rating,
					weightInfo.ratings,
					weightInfo.weights,
					false,
				) * injuryFactor;

			if (isSport("hockey") && k === "goalkeeping") {
				const numConsecutiveGamesG = p.numConsecutiveGamesG ?? 0;

				if (p.numConsecutiveGamesG !== undefined) {
					(p2 as any).numConsecutiveGamesG = p.numConsecutiveGamesG;
				}

				if (numConsecutiveGamesG > 0) {
					if (playoffs && game6EliminationGameOrGame7 === undefined) {
						game6EliminationGameOrGame7 = await isGame6EliminationGameOrGame7(
							playoffs,
							teamInput.tid,
						);
					}

					p2.compositeRating[k] *= await getNumConsecutiveGamesGFactor(
						numConsecutiveGamesG,
						playoffs,
						game6EliminationGameOrGame7,
					);
				}
			}
		}

		if (isSport("basketball")) {
			p2.compositeRating.usage = p2.compositeRating.usage ** 1.9;
		}
		const seasonStatsKeys = bySport({
			baseball: [
				"pa",
				"bb",
				"hbp",
				"sf",
				"h",
				"2b",
				"3b",
				"hr",
				"er",
				"outs",
				"w",
				"l",
				"sv",
				"bs",
				"hld",
				"sb",
			],
			basketball: undefined,
			football: [
				"pssTD",
				"rusTD",
				"recTD",
				"defSk",
				"fmb",
				"defInt",
				"krTD",
				"prTD",
				"defFmbFrc",
			],
			hockey: ["shG", "evG", "ppG", "shA", "evA", "ppA"],
		});
		if (seasonStatsKeys !== undefined) {
			let hasStats;
			let ps;
			if (allStarGame) {
				// Only look at regular season stats, in case All-Star Game is in playoffs
				ps = p.stats.findLast((ps) => !ps.playoffs);
				hasStats = !!ps && ps.season === g.get("season");
			} else {
				ps = p.stats.at(-1);
				hasStats = exhibitionGame || statsRowIsCurrent(ps, t.id, playoffs);
			}
			for (const key of seasonStatsKeys) {
				seasonStats[key] = hasStats ? ps[key] : 0;
			}
			(p2 as any).seasonStats = seasonStats;
		}
		if (isSport("baseball")) {
			(p2 as any).pFatigue = p.pFatigue ?? 0;
		}

		p2.stat = {
			...playerStats,

			// Starters will play at least 3 minutes before being subbed out, after that the default here doesn't matter
			courtTime: -3,
			benchTime: 0,
			energy: 1,
		};

		if (player.stats.byPos) {
			for (const key of player.stats.byPos) {
				p2.stat[key] = [];
			}
		}

		t.player.push(p2);
	}

	for (const p of t.player) {
		delete p.pid;
	}

	if (isSport("basketball")) {
		t.pace = 0;

		let numPlayers = 0;
		for (const p of t.player) {
			if (p.injury.gamesRemaining === 0 || p.injury.playingThrough) {
				numPlayers += 1;
				t.pace += p.compositeRating.pace;

				if (numPlayers >= MAX_NUM_PLAYERS_PACE) {
					break;
				}
			}
		}

		if (numPlayers > 0) {
			t.pace /= numPlayers;
		}
		t.pace = t.pace * 15 + 100; // Scale between 100 and 115

		if (allStarGame) {
			t.pace *= 1.15;
		}
	}

	t.stat = { ...teamStats, pts: 0, ptsQtrs: isSport("baseball") ? [] : [0] };

	if (team.stats.byPos) {
		for (const key of team.stats.byPos) {
			if (!key.startsWith("opp")) {
				t.stat[key] = [];
			}
		}
	}

	return t;
};

/**
 * Load the teams specified by tids into an object of team objects.
 *
 * The team objects contain all the information needed to simulate games. It would be more efficient if it only loaded team data for teams that are actually playing, particularly in the playoffs.
 *
 * @memberOf core.game
 * @param {IDBTransaction} ot An IndexedDB transaction on players and teams.
 * @returns {Promise<Record<number, undefined | ReturnType<typeof processTeam>>>} Resolves to a record of team objects, ordered by tid.
 */
const loadTeams = async (tids: number[], conditions: Conditions) => {
	const teams: Record<
		number,
		undefined | Awaited<ReturnType<typeof processTeam>>
	> = {};
	if (tids.length === 2 && tids.includes(-1) && tids.includes(-2)) {
		// All-Star Game
		const allStars = await allStar.getOrCreate(g.get("season"));
		if (!allStars) {
			throw new Error("Should never happen");
		}
		if (!allStars.finalized) {
			await allStar.draftAll();
		}
		if (allStars.dunk && allStars.dunk.winner === undefined) {
			while (true) {
				const type = await allStar.dunkContest.simNextDunkEvent(conditions);
				if (type === "all") {
					break;
				}
			}
		}
		if (allStars.three && allStars.three.winner === undefined) {
			while (true) {
				const type = await allStar.threeContest.simNextThreeEvent(conditions);
				if (type === "all") {
					break;
				}
			}
		}

		for (const tid of tids) {
			const allStarsTeamInd = tid === -1 ? 0 : 1;
			const players = (
				await Promise.all(
					allStars.teams[allStarsTeamInd].map(async ({ pid }) => {
						const p = await idb.cache.players.get(pid);

						if (!p) {
							// Can happen if player was deleted before starting sim
							return;
						}

						return p;
					}),
				)
			).filter((p) => p !== undefined) as Player[];

			const depth = await team.genDepth(players);

			teams[tid] = await processTeam(
				{
					tid,
					playThroughInjuries: [0, 0],
					depth,
				},
				{
					cid: -1,
					did: -1,
					won: 0,
					lost: 0,
					tied: 0,
					otl: 0,
				},
				players,
			);
		}
	} else {
		await Promise.all(
			tids.map(async (tid) => {
				const [players, team, teamSeason] = await Promise.all([
					idb.cache.players.indexGetAll("playersByTid", tid),
					idb.cache.teams.get(tid),
					idb.cache.teamSeasons.indexGet("teamSeasonsByTidSeason", [
						tid,
						g.get("season"),
					]),
				]);

				if (!team) {
					throw new Error("Invalid tid");
				}
				if (!teamSeason) {
					throw new Error("Team season not found");
				}

				teams[tid] = await processTeam(team, teamSeason, players);
			}),
		);
	}

	return teams;
};

export default loadTeams;
