import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import type {
	UpdateEvents,
	ViewInput,
	TeamSeason,
	Player,
} from "../../common/types.ts";
import { getBestPos } from "../core/player/checkJerseyNumberRetirement.ts";
import { bySport } from "../../common/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { groupByUnique } from "../../common/utils.ts";
import { getPlayoffsByConfBySeason } from "./frivolitiesTeamSeasons.ts";

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
				season: teamSeason.season,
			}),
			numPlayoffRounds,
			name:
				teamSeason.region && teamSeason.name
					? `${teamSeason.region} ${teamSeason.name}`
					: undefined,
			tid: teamSeason.tid,
			abbrev:
				teamSeason.abbrev || g.get("teamInfoCache")[teamSeason.tid]!.abbrev,
			note: teamSeason.note,
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

export const getHistory = async (
	teamSeasons: TeamSeason[],
	playersAll: Player[],
	playoffsByConfBySeason: PlayoffsByConfBySeason,
	gmHistory?: boolean,
) => {
	const teamHistory = getHistoryTeam(teamSeasons, playoffsByConfBySeason);

	const stats = bySport({
		baseball: ["gp", "keyStats", "war"],
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ewa"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	let players = await idb.getCopies.playersPlus(playersAll, {
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
			"retirableJerseyNumbers",
		],
		ratings: ["pos", "season"],
		stats: ["season", "abbrev", ...stats],
	});

	// Not sure why this is necessary, but sometimes statsTids gets an entry but ratings doesn't
	players = players.filter((p) => p.careerStats.gp > 0);

	players = addFirstNameShort(players);

	const champSeasons = new Set(
		teamHistory.history
			.filter((row) => row.playoffRoundsWon >= row.numPlayoffRounds)
			.map((row) => row.season),
	);

	for (const p of players) {
		p.lastYr = "";
		if (p.stats.length > 0) {
			p.lastYr = p.stats.at(-1).season.toString();
			if (gmHistory) {
				p.lastYr += ` ${p.stats.at(-1).abbrev}`;
			}
		}

		p.numRings = p.awards.filter(
			(award: Player["awards"][number]) =>
				award.type === "Won Championship" && champSeasons.has(award.season),
		).length;
		delete p.awards;

		// undefined as 2nd argument because we have already filtered stats before getting here
		p.pos = getBestPos(p, undefined);

		delete p.ratings;
		delete p.stats;
	}

	return {
		...teamHistory,
		players,
		stats,
		userTid: g.get("userTid"),
	};
};

const updateTeamHistory = async (
	inputs: ViewInput<"teamHistory">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("retiredJerseys") ||
		updateEvents.includes("gameAttributes") ||
		inputs.abbrev !== state.abbrev
	) {
		const t = await idb.cache.teams.get(inputs.tid);
		if (!t) {
			throw new Error("Invalid team ID number");
		}

		const teamSeasons = await idb.getCopies.teamSeasons(
			{
				tid: inputs.tid,
			},
			"noCopyCache",
		);

		const retiredJerseyNumbers = await Promise.all(
			(t.retiredJerseyNumbers || []).map(async (row) => {
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
					const p = await idb.getCopy.players({ pid: row.pid }, "noCopyCache");
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

		const players = await idb.getCopies.players({
			statsTid: inputs.tid,
		});
		for (const p of players) {
			p.stats = p.stats.filter((row) => row.tid === inputs.tid);
			const retirableJerseyNumbers: Record<string, string[]> = {};
			(p as any).retirableJerseyNumbers = retirableJerseyNumbers;
			for (const { gp, jerseyNumber, playoffs, season } of p.stats) {
				if (
					!playoffs &&
					gp > 0 &&
					jerseyNumber !== undefined &&
					!retiredByPid[p.pid]?.has(jerseyNumber)
				) {
					if (!retirableJerseyNumbers[jerseyNumber]) {
						retirableJerseyNumbers[jerseyNumber] = [];
					}
					retirableJerseyNumbers[jerseyNumber].push(season);
				}
			}
		}

		const playoffsByConfBySeason = await getPlayoffsByConfBySeason();
		const history = await getHistory(
			teamSeasons,
			players,
			playoffsByConfBySeason,
		);

		const playersByPid = groupByUnique(history.players, "pid");
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
			...history,
			abbrev: inputs.abbrev,
			tid: inputs.tid,
			godMode: g.get("godMode"),
			season: g.get("season"),
			retiredJerseyNumbers: retiredJerseyNumbers2,
		};
	}
};

export default updateTeamHistory;
