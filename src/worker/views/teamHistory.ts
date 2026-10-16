import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type { TeamSeason, Player } from "../../common/types.ts";
import { defineView } from "../util/defineView.ts";
import { getBestPos } from "../core/player/checkJerseyNumberRetirement.ts";
import { bySport } from "../../common/sportFunctions.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { groupByUnique } from "../../common/utils.ts";
import { getPlayoffsByConfBySeason } from "./frivolitiesTeamSeasons.ts";
import { DEFAULT_TEAM_COLORS } from "../../common/constants.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { validateAbbrev } from "../util/processInputs.ts";
import { player } from "../core/index.ts";

const processInputs = (params: RouteParams<"teamHistory">) => {
	const [tid, abbrev] = validateAbbrev(params.abbrev);
	return { abbrev, tid };
};

type PlayoffsByConfBySeason = Awaited<
	ReturnType<typeof getPlayoffsByConfBySeason>
>;

export const getHistoryTeam = (
	teamSeasons: TeamSeason[],
	playoffsByConfBySeason: PlayoffsByConfBySeason,
) => {
	let bestRecord;
	let worstRecord;
	let bestWinp = -Infinity;
	let worstWinp = Infinity;

	const history: {
		season: number;
		won: number;
		lost: number;
		tied?: number;
		otl?: number;
		playoffRoundsWon: number;
		numPlayoffRounds: number;
		roundsWonText: string;
		name?: string;
		tid: number;
		abbrev: string;
		note?: string;
		colors: [string, string, string];
		imgURL?: string;
		imgURLSmall?: string;
	}[] = [];

	let totalWon = 0;
	let totalLost = 0;
	let totalTied = 0;
	let totalOtl = 0;
	let playoffAppearances = 0;
	let finalsAppearances = 0;
	let championships = 0;
	let lastChampionship = undefined;

	for (const teamSeason of teamSeasons) {
		const numPlayoffRounds = g.get(
			"numGamesPlayoffSeries",
			teamSeason.season,
		).length;

		history.push({
			season: teamSeason.season,
			won: teamSeason.won,
			lost: teamSeason.lost,
			tied: teamSeason.tied,
			otl: teamSeason.otl,
			playoffRoundsWon: teamSeason.playoffRoundsWon,
			roundsWonText: helpers.roundsWonText({
				playoffRoundsWon: teamSeason.playoffRoundsWon,
				numPlayoffRounds,
				playoffsByConf: playoffsByConfBySeason.get(teamSeason.season),
			}),
			numPlayoffRounds,
			name:
				teamSeason.region && teamSeason.name
					? `${teamSeason.region} ${teamSeason.name}`
					: undefined,
			tid: teamSeason.tid,
			abbrev:
				teamSeason.abbrev ?? g.get("teamInfoCache")[teamSeason.tid]!.abbrev,
			note: teamSeason.note,
			colors: teamSeason.colors ?? DEFAULT_TEAM_COLORS,
			imgURLSmall:
				teamSeason.imgURLSmall ??
				teamSeason.imgURL ??
				g.get("teamInfoCache")[teamSeason.tid]?.imgURLSmall ??
				g.get("teamInfoCache")[teamSeason.tid]?.imgURL,
		});
		totalWon += teamSeason.won;
		totalLost += teamSeason.lost;
		totalTied += teamSeason.tied;
		totalOtl += teamSeason.otl;

		if (teamSeason.playoffRoundsWon >= 0) {
			playoffAppearances += 1;
		}

		if (
			teamSeason.playoffRoundsWon >= numPlayoffRounds - 1 &&
			teamSeason.playoffRoundsWon >= 0
		) {
			finalsAppearances += 1;
		}

		if (teamSeason.playoffRoundsWon === numPlayoffRounds) {
			championships += 1;
			lastChampionship = teamSeason.season;
		}

		const gp = helpers.getTeamSeasonGp(teamSeason);
		if (gp > 0) {
			const winp = helpers.calcWinp(teamSeason);

			if (
				!bestRecord ||
				(winp >= bestWinp &&
					(teamSeason.won > bestRecord.won ||
						teamSeason.lost < bestRecord.lost))
			) {
				bestRecord = history.at(-1);
				bestWinp = winp;
			}

			if (
				!worstRecord ||
				(winp <= worstWinp &&
					(teamSeason.lost > worstRecord.lost ||
						teamSeason.won < worstRecord.won))
			) {
				worstRecord = history.at(-1);
				worstWinp = winp;
			}
		}
	}

	history.reverse(); // Show most recent season first

	const totalWinp = helpers.calcWinp({
		won: totalWon,
		lost: totalLost,
		tied: totalTied,
		otl: totalOtl,
	});

	return {
		history,
		totalWon,
		totalLost,
		totalTied,
		totalOtl,
		totalWinp,
		playoffAppearances,
		finalsAppearances,
		championships,
		bestRecord,
		worstRecord,
		lastChampionship,
	};
};

export const historyStats = bySport({
	baseball: ["gp", "keyStats", "war"],
	basketball: ["gp", "min", "pts", "trb", "ast", "per", "ewa"],
	football: ["gp", "keyStats", "av"],
	hockey: ["gp", "keyStats", "ops", "dps", "ps"],
} as const);

// Returns a function that turns a player into a row of the players table, or undefined if the player should not be shown. The player's stats should already be filtered to only teamSeasons. The returned function is synchronous, so it can be used in the map function of idb.merged.players.getAll, and then the full player objects are not all held in memory at once.
export const getHistoryPlayerProcessor = (
	teamSeasons: TeamSeason[],
	history: ReturnType<typeof getHistoryTeam>["history"],
	gmHistory: boolean,
) => {
	const formatOptions = {
		attrs: [
			"pid",
			"firstName",
			"lastName",
			"injury",
			"tid",
			"hof",
			"watch",
			"jerseyNumber",
			"awards",
		],
		ratings: ["pos", "season"],
		stats: ["season", "abbrev", ...historyStats],
	} as const;
	// Stats are already filtered to these team seasons, so they're the only ones that abbrevs are needed for
	const abbrevs = player.abbrevsFromTeamSeasons(teamSeasons);
	const formatPlayer = player.createFormatter(formatOptions, abbrevs);

	const champSeasons = new Set(
		history
			.filter((row) => row.playoffRoundsWon >= row.numPlayoffRounds)
			.map((row) => row.season),
	);

	return (pRaw: Player) => {
		const pFormatted = formatPlayer(pRaw);
		if (!pFormatted) {
			return;
		}

		// Not sure why this is necessary, but sometimes statsTids gets an entry but ratings doesn't
		if ((pFormatted.careerStats.gp ?? 0) <= 0) {
			return;
		}

		const { awards, ratings, stats: playerStats, ...p } = pFormatted;

		let lastYr = "";
		const lastStats = playerStats.at(-1);
		if (lastStats) {
			lastYr = lastStats.season.toString();
			if (gmHistory) {
				lastYr += ` ${lastStats.abbrev}`;
			}
		}

		const numRings = awards.filter(
			(award) =>
				award.type === "Won Championship" && champSeasons.has(award.season),
		).length;

		return {
			...p,
			lastYr,
			numRings,

			// undefined as 2nd argument because we have already filtered stats before getting here
			pos: getBestPos({ ratings, stats: playerStats }, undefined),
		};
	};
};

export default defineView({
	id: "teamHistory",
	processInputs,
	load: async ({ inputs, updateEvents, prevInputs }) => {
		if (
			updateEvents.has("firstRun") ||
			updateEvents.has("gameSim") ||
			updateEvents.has("retiredJerseys") ||
			updateEvents.has("gameAttributes") ||
			inputs.abbrev !== prevInputs?.abbrev
		) {
			const t = await idb.cache.teams.get(inputs.tid);
			if (!t) {
				throw new Error("Invalid team ID number");
			}

			const teamSeasons = await idb.merged.teamSeasons.getAll({
				tid: inputs.tid,
			});

			const retiredJerseyNumbers = await Promise.all(
				(t.retiredJerseyNumbers ?? []).map(async (row) => {
					const ts = teamSeasons.find((ts) => ts.season === row.seasonTeamInfo);
					const teamInfo = {
						colors: ts ? ts.colors : t.colors,
						name: ts ? ts.name : t.name,
						region: ts ? ts.region : t.region,
					};

					let firstName;
					let lastName;
					let pos;
					let lastSeasonWithTeam = -Infinity;
					if (row.pid !== undefined) {
						const p = await idb.merged.players.get(row.pid);
						if (p) {
							firstName = p.firstName;
							lastName = p.lastName;
							pos = getBestPos(p, inputs.tid);
							for (const row of p.stats) {
								if (row.tid === inputs.tid && row.season > lastSeasonWithTeam) {
									lastSeasonWithTeam = row.season;
								}
							}
						}
					}

					return {
						...row,
						teamInfo,
						firstName,
						lastName,
						pos,
						lastSeasonWithTeam,
					};
				}),
			);

			const retiredByPid: Record<number, Set<string>> = {};
			for (const { pid, number } of retiredJerseyNumbers) {
				if (pid !== undefined) {
					if (!retiredByPid[pid]) {
						retiredByPid[pid] = new Set();
					}
					retiredByPid[pid].add(number);
				}
			}

			const playoffsByConfBySeason = await getPlayoffsByConfBySeason();
			const teamHistory = getHistoryTeam(teamSeasons, playoffsByConfBySeason);
			const processPlayer = getHistoryPlayerProcessor(
				teamSeasons,
				teamHistory.history,
				false,
			);

			const players = addFirstNameShort(
				(
					await idb.merged.players.getAll(
						{ statsTid: inputs.tid },
						{
							map: (pRaw) => {
								// Only stats for this team. This makes a new object, so the player in the cache is not changed.
								const stats = pRaw.stats.filter(
									(row) => row.tid === inputs.tid,
								);

								const row = processPlayer({ ...pRaw, stats });
								if (!row) {
									return;
								}

								const retirableJerseyNumbers: Record<string, number[]> = {};
								for (const { gp, jerseyNumber, playoffs, season } of stats) {
									if (
										!playoffs &&
										(gp ?? 0) > 0 &&
										jerseyNumber !== undefined &&
										!retiredByPid[pRaw.pid]?.has(jerseyNumber)
									) {
										retirableJerseyNumbers[jerseyNumber] ??= [];
										retirableJerseyNumbers[jerseyNumber].push(season);
									}
								}

								return {
									...row,
									retirableJerseyNumbers,
								};
							},
						},
					)
				).filter((p) => p !== undefined),
			);

			const playersByPid = groupByUnique(players, "pid");
			const retiredJerseyNumbers2 = retiredJerseyNumbers.map((row) => {
				let numRings = 0;
				if (row.pid !== undefined) {
					numRings = playersByPid[row.pid]?.numRings ?? 0;
				}

				return {
					firstName: row.firstName,
					lastName: row.lastName,
					number: row.number,
					pid: row.pid,
					pos: row.pos,
					score: row.score,
					lastSeasonWithTeam: row.lastSeasonWithTeam,
					seasonRetired: row.seasonRetired,
					seasonTeamInfo: row.seasonTeamInfo,
					teamInfo: row.teamInfo,
					text: row.text,
					numRings,
				};
			});

			return {
				...teamHistory,
				players,
				stats: historyStats,
				abbrev: inputs.abbrev,
				tid: inputs.tid,
				retiredJerseyNumbers: retiredJerseyNumbers2,
			};
		}
	},
});
