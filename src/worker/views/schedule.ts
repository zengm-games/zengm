import { player, season, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, getProcessedGames, helpers } from "../util/index.ts";
import type {
	UpdateEvents,
	ViewInput,
	Game,
	PlayerInjury,
} from "../../common/types.ts";
import { bySport, isSport } from "../../common/index.ts";
import { groupBy, groupByUnique, orderBy } from "../../common/utils.ts";
import { getActualPlayThroughInjuries } from "../core/game/loadTeams.ts";
import { getStartingPitcher } from "../core/GameSim.baseball/getStartingPitcher.ts";
import { P_FATIGUE_DAILY_REDUCTION } from "../core/game/writePlayerStats.ts";

export const getUpcoming = async ({
	day,
	onlyOneGame,
	tid,
}: {
	day?: number;
	onlyOneGame?: boolean;
	tid?: number;
}) => {
	const schedule = await season.getSchedule();

	const firstGame = schedule[0];
	if (!firstGame) {
		return [];
	}

	// Use this to calculate injury healing from today until the day of a game
	const todayDay = firstGame.day;

	let keptOneGame = false;
	const filteredSchedule = schedule.filter((game) => {
		const keep =
			(tid === undefined ||
				tid === game.homeTid ||
				tid === game.awayTid ||
				(game.homeTid === -1 && game.awayTid === -2) ||
				(game.homeTid === -3 && game.awayTid === -3)) &&
			(day === undefined || game.day === day) &&
			(!onlyOneGame || !keptOneGame);

		if (keep) {
			keptOneGame = true;
		}

		return keep;
	});

	if (filteredSchedule.length === 0) {
		return [];
	}

	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["playThroughInjuries", "tid"],
			seasonAttrs: ["won", "lost", "tied", "otl"],
			season: g.get("season"),
			active: true,
		},
		"noCopyCache",
	);
	const teamsByTid = groupByUnique(teams, "tid");

	const playersRaw = await idb.cache.players.indexGetAll("playersByTid", [
		0, // Active players have tid >= 0
		Infinity,
	]);
	const players = await idb.getCopies.playersPlus(playersRaw, {
		attrs: ["injury", "pid", "value", "tid"],
		ratings: ["ovr", "pos", "ovrs"],
		season: g.get("season"),
		fuzz: true,
	});
	const playersByTid = groupBy(players, "tid");

	const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
	const roundSeries = playoffSeries
		? playoffSeries.currentRound === -1 && playoffSeries.playIns
			? playoffSeries.playIns.flat()
			: playoffSeries.series[playoffSeries.currentRound]
		: undefined;

	const getTeam = (tid: number, day: number) => {
		const t = teamsByTid[tid];

		// For basketball this is fast, but for other sports it's a bit slow. Could cache sometimes, depending on which players are injured (if nobody is in playThroughInjuries window). This would apply by default in the regualr season, which is what matters, since the default is 0
		const ovr = team.ovr(playersByTid[tid] ?? [], {
			accountForInjuredPlayers: {
				numDaysInFuture: day - todayDay,
				playThroughInjuries: getActualPlayThroughInjuries(t ?? "default"),
			},

			// This is better than checking g.get("phase"), because g.get("phase") will still show up as regular season when this is called (via setSchedule) from newDayPlayoffSeries
			playoffs: !!roundSeries,
		});

		if (tid < 0) {
			return { tid };
		}

		if (!t) {
			throw new Error(`No team found for tid ${tid}`);
		}

		let playoffs:
			| {
					seed: number;
					won: number;
					lost: number;
			  }
			| undefined;
		if (roundSeries) {
			for (const series of roundSeries) {
				if (series.home.tid === tid) {
					playoffs = {
						seed: series.home.seed,
						won: series.home.won,
						lost: series.away ? series.away.won : 0,
					};
				} else if (series.away && series.away.tid === tid) {
					playoffs = {
						seed: series.away.seed,
						won: series.away.won,
						lost: series.home.won,
					};
				}
			}
		}

		return {
			ovr,
			tid,
			won: t.seasonAttrs.won,
			lost: t.seasonAttrs.lost,
			tied: t.seasonAttrs.tied,
			otl: t.seasonAttrs.otl,
			playoffs,
		};
	};

	const upcoming: {
		finals?: boolean;
		forceWin?: number | "tie";
		gid: number;
		season: number;
		teams: [ReturnType<typeof getTeam>, ReturnType<typeof getTeam>];
	}[] = filteredSchedule.map(
		({ awayTid, day, finals, forceWin, gid, homeTid }) => {
			return {
				finals,
				forceWin,
				gid,
				season: g.get("season"),
				teams: [getTeam(homeTid, day), getTeam(awayTid, day)],
			};
		},
	);

	return upcoming;
};

export const getTopPlayers = async <T extends any[]>(
	skipTid: number | undefined,
	numPerTeam: number,
) => {
	const playersPlusOptions = (tid: number) => {
		return {
			attrs: ["pid", "name", "injury", "abbrev", "tid"],
			ratings: ["ovr", "pos"],
			season: g.get("season"),
			stats: bySport({
				baseball: ["keyStatsShort"],
				basketball: ["pts", "trb", "ast"],
				football: undefined, // football keyStats is too long
				hockey: ["keyStats"],
			}),
			showNoStats: true,
			showRookies: true,
			fuzz: true,
		};
	};

	if (isSport("baseball")) {
		// Show SP rather than best player
		const startingPitchersByGid: Record<number, [any, any]> = {};

		const players = await idb.cache.players.getAll();
		const playersByPid = groupByUnique(players, "pid");
		const teams = await idb.cache.teams.getAll();
		const pitchersByTid: Record<number, any[]> = {};
		const pitchersByPid: Record<number, any> = {};

		// Need to keep track of injury without mutating player objects (since injuries are shown in UI), to predict future day starters. Might as well track pFatigue here too, for clarity.
		const simulatedInfo: Record<
			number,
			{
				pFatigue: number;
				injury: PlayerInjury;
			}
		> = {};

		for (const t of teams) {
			const depthPlayers = (t.depth as { P: number[] }).P.map(
				(pid) => playersByPid[pid],
			).filter((p) => p !== undefined);
			const depthPlayersProcessed = await idb.getCopies.playersPlus(
				depthPlayers,
				playersPlusOptions(t.tid),
			);

			for (const p of depthPlayers) {
				simulatedInfo[p.pid] = {
					pFatigue: p.pFatigue ?? 0,
					injury: { ...p.injury },
				};
			}
			for (const p of depthPlayersProcessed) {
				pitchersByPid[p.pid] = p;
			}

			pitchersByTid[t.tid] = depthPlayersProcessed;
		}

		// We need the whole schedule even if just displaying a single game on daily_schedule so we know how many games a team has played before a given game, so we can estimate fatigue
		const upcoming = await season.getSchedule();
		let currentDay = upcoming[0]?.day;
		if (currentDay !== undefined) {
			const addSimulatedInfo = (pitchers: any[]) => {
				return pitchers.map((p) => {
					const info = simulatedInfo[p.pid]!;
					return {
						...p,
						pFatigue: info.pFatigue,
						injured: info.injury.gamesRemaining > 0,
					};
				});
			};

			for (const game of upcoming) {
				if (game.day !== currentDay) {
					// Rest/heal 1 day
					for (const p of Object.values(pitchersByTid).flat()) {
						const info = simulatedInfo[p.pid]!;
						info.pFatigue = helpers.bound(
							info.pFatigue - P_FATIGUE_DAILY_REDUCTION,
							0,
							80,
						);

						if (info.injury.gamesRemaining > 0) {
							info.injury.gamesRemaining -= 1;
							if (info.injury.gamesRemaining === 0) {
								info.injury = { type: "Healthy", gamesRemaining: 0 };
							}
						}
					}

					currentDay = game.day;
				}

				const pitchers0 = pitchersByTid[game.homeTid];
				const pitchers1 = pitchersByTid[game.awayTid];
				if (pitchers0 && pitchers1) {
					const p0 = getStartingPitcher(addSimulatedInfo(pitchers0), false);
					const p1 = getStartingPitcher(addSimulatedInfo(pitchers1), false);

					startingPitchersByGid[game.gid] = [
						// Get original injury values in pitchersByPid, whereas p0/p1 have them from simulatedInfo
						pitchersByPid[p0.pid],
						pitchersByPid[p1.pid],
					];

					for (const { pid } of [p0, p1]) {
						simulatedInfo[pid]!.pFatigue = P_FATIGUE_DAILY_REDUCTION * 5;
					}
				}
			}
		}

		return {
			type: "byGid" as const,
			startingPitchersByGid,
		};
	} else {
		const topPlayers: Record<number, T> = {};

		const teamInfoCache = g.get("teamInfoCache");

		for (let tid = 0; tid < teamInfoCache.length; tid++) {
			const t = teamInfoCache[tid]!;
			if (t.disabled || tid === skipTid) {
				continue;
			}

			const playersRaw = orderBy(
				await idb.cache.players.indexGetAll("playersByTid", tid),
				(t) => {
					const ratings = t.ratings.at(-1)!;
					const ovr = player.fuzzRating(ratings.ovr, ratings.fuzz);
					return ovr;
				},
				"desc",
			)
				.slice(0, numPerTeam)
				.reverse();

			const players = await idb.getCopies.playersPlus(
				playersRaw,
				playersPlusOptions(tid),
			);

			topPlayers[tid] = players as T;
		}

		return {
			type: "byTid" as const,
			playersByTid: topPlayers,
		};
	}
};

const updateUpcoming = async (
	inputs: ViewInput<"schedule">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase") ||
		inputs.abbrev !== state.abbrev
	) {
		const upcoming = await getUpcoming({
			tid: inputs.tid,
		});

		let canLiveSimFirstGame = false;
		const upcoming0 = upcoming[0];
		if (upcoming0) {
			const scheduleToday = await season.getSchedule(true);
			canLiveSimFirstGame = scheduleToday.some(
				(game) => game.gid === upcoming0.gid,
			);
		}

		const topPlayers = await getTopPlayers<[any, any]>(inputs.tid, 2);

		return {
			abbrev: inputs.abbrev,
			canLiveSimFirstGame,
			elam: g.get("elam"),
			elamASG: g.get("elamASG"),
			phase: g.get("phase"),
			tid: inputs.tid,
			ties: season.hasTies("current"),
			topPlayers,
			upcoming,
		};
	}
};

// Based on views.gameLog.updateGamesList
const updateCompleted = async (
	inputs: ViewInput<"schedule">,
	updateEvents: UpdateEvents,
	state: {
		abbrev: string;
		completed: Game[];
	},
) => {
	if (updateEvents.includes("firstRun") || inputs.abbrev !== state.abbrev) {
		// Load all games in list
		const completed = await getProcessedGames({
			tid: inputs.tid,
			season: g.get("season"),
			includeAllStarGame: true,
		});

		return {
			completed,
		};
	}

	if (updateEvents.includes("gameSim")) {
		// Partial update of only new games
		const completed = Array.isArray(state.completed) ? state.completed : [];

		const games = await getProcessedGames({
			tid: inputs.tid,
			season: g.get("season"),
			loadedGames: state.completed,
			includeAllStarGame: true,
		});

		for (let i = games.length - 1; i >= 0; i--) {
			completed.unshift(games[i]!);
		}

		return {
			completed,
		};
	}
};

export default async (
	inputs: ViewInput<"schedule">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	return Object.assign(
		{},
		await updateUpcoming(inputs, updateEvents, state),
		await updateCompleted(inputs, updateEvents, state),
	);
};
