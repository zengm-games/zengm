import { allStar, player, team } from "..";
import { idb } from "../../db";
import { g, helpers, random } from "../../util";
import type {
	Player,
	MinimalPlayerRatings,
	Conditions,
} from "../../../common/types";
import {
	bySport,
	COMPOSITE_WEIGHTS,
	DEFAULT_PLAY_THROUGH_INJURIES,
	isSport,
	PHASE,
} from "../../../common";
import playThroughInjuriesFactor from "../../../common/playThroughInjuriesFactor";
import statsRowIsCurrent from "../player/statsRowIsCurrent";
import { P_FATIGUE_DAILY_REDUCTION } from "./writePlayerStats";

const MAX_NUM_PLAYERS_PACE = 7;

const skipPlayerStats = bySport({
	baseball: ["minAvailable"],
	basketball: ["gp", "minAvailable"],
	football: ["gp", "minAvailable"],
	hockey: ["gp", "minAvailable"],
});

let playerStats: Record<string, number | number[]>;
let teamStats: Record<string, number>;

export const processTeam = (
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
		playerStats = player.stats.raw.reduce<Record<string, number>>(
			(stats, stat) => {
				if (skipPlayerStats.includes(stat)) {
					return stats;
				}

				stats[stat] = 0;
				return stats;
			},
			{},
		);
	}

	if (!teamStats) {
		teamStats = team.stats.raw.reduce<Record<string, number>>((stats, stat) => {
			stats[stat] = 0;
			return stats;
		}, {});
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

	// Injury-adjusted ovr
	const playersCurrent = players
		.filter((p: any) => p.injury.gamesRemaining === 0)
		.map(p => ({
			pid: p.pid,
			value: p.value,
			ratings: {
				ovr: player.fuzzRating(p.ratings.at(-1)!.ovr, p.ratings.at(-1)!.fuzz),
				ovrs: player.fuzzOvrs(p.ratings.at(-1)!.ovrs, p.ratings.at(-1)!.fuzz),
				pos: p.ratings.at(-1)!.pos,
			},
		}));
	const ovr = team.ovr(playersCurrent, {
		playoffs,
	});

	const t: any = {
		id: teamInput.tid,
		pace: 0,
		won: teamSeason.won,
		lost: teamSeason.lost,
		tied: g.get("ties", "current") ? teamSeason.tied : undefined,
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

	let playThroughInjuriesBoth;
	if (g.get("userTids").includes(teamInput.tid) && !g.get("spectator")) {
		playThroughInjuriesBoth = teamInput.playThroughInjuries;
	} else {
		playThroughInjuriesBoth = DEFAULT_PLAY_THROUGH_INJURIES;
	}

	const playThroughInjuries = playThroughInjuriesBoth[playoffs ? 1 : 0];

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
		if (!g.get("userTids").includes(t.id)) {
			p2.ptModifier = 1;
		}

		// These use the same formulas as the skill definitions in player.skills!
		for (const k of Object.keys(COMPOSITE_WEIGHTS)) {
			p2.compositeRating[k] =
				player.compositeRating(
					rating,
					COMPOSITE_WEIGHTS[k].ratings,
					COMPOSITE_WEIGHTS[k].weights,
					false,
				) * injuryFactor;

			if (isSport("hockey") && k === "goalkeeping") {
				let numConsecutiveGamesG = p.numConsecutiveGamesG ?? 0;

				if (playoffs) {
					numConsecutiveGamesG /= 2;
				}

				if (p.numConsecutiveGamesG !== undefined) {
					(p2 as any).numConsecutiveGamesG = p.numConsecutiveGamesG;
				}

				if (numConsecutiveGamesG > 0) {
					// Decrease rating by up to 40%
					p2.compositeRating[k] *= helpers.bound(
						1 - numConsecutiveGamesG * random.uniform(0.0, 0.09),
						0.6,
						1,
					);
				}
			}
		}

		if (isSport("basketball")) {
			p2.compositeRating.usage = p2.compositeRating.usage ** 1.9;
		}

		if (isSport("baseball")) {
			(p2 as any).pFatigue = p.pFatigue ?? 0;
			if (playoffs) {
				// Pitchers play through some fatigue in playoffs
				(p2 as any).pFatigue -= P_FATIGUE_DAILY_REDUCTION;
				if ((p2 as any).pFatigue < 0) {
					(p2 as any).pFatigue = 0;
				}
			}

			// Store some pre-game season stats that are displayed in box score
			const seasonStats: Record<string, number> = {};
			const seasonStatsKeys = [
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
			];

			let hasStats;
			let ps;
			if (allStarGame) {
				// Only look at regular season stats, in case All-Star Game is in playoffs
				ps = p.stats.filter(ps => !ps.playoffs).at(-1);
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

		p2.stat = {
			gs: 0,
			min: 0,
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
			t.stat[key] = [];
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
 * @param {Promise} Resolves to an array of team objects, ordered by tid.
 */
const loadTeams = async (tids: number[], conditions: Conditions) => {
	const teams: Record<number, undefined | ReturnType<typeof processTeam>> = {};
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
			).filter(p => p !== undefined) as Player[];

			const depth = await team.genDepth(players);

			teams[tid] = processTeam(
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
			tids.map(async tid => {
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

				teams[tid] = processTeam(team, teamSeason, players);
			}),
		);
	}

	return teams;
};

export default loadTeams;
