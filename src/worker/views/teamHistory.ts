import { idb } from "../db";
import { g, helpers } from "../util";
import type {
	UpdateEvents,
	ViewInput,
	TeamSeason,
	Player,
} from "../../common/types";
import { getMostCommonPosition } from "../core/player/checkJerseyNumberRetirement";
import { bySport } from "../../common";

export const getHistoryTeam = (teamSeasons: TeamSeason[]) => {
	let bestRecord;
	let worstRecord;
	let bestWinp = -Infinity;
	let worstWinp = Infinity;
	let mostWon = 0;
	let mostLost = 0;

	const history: {
		season: number;
		won: number;
		lost: number;
		tied?: number;
		otl?: number;
		playoffRoundsWon: number;
		numPlayoffRounds: number;
		numConfs: number;
		name?: string;
		tid: number;
		abbrev: string;
	}[] = [];

	let totalWon = 0;
	let totalLost = 0;
	let totalTied = 0;
	let totalOtl = 0;
	let playoffAppearances = 0;
	let finalsAppearances = 0;
	let championships = 0;

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
			numPlayoffRounds,
			numConfs: g.get("confs", teamSeason.season).length,
			name:
				teamSeason.region && teamSeason.name
					? `${teamSeason.region} ${teamSeason.name}`
					: undefined,
			tid: teamSeason.tid,
			abbrev:
				teamSeason.abbrev || g.get("teamInfoCache")[teamSeason.tid]?.abbrev,
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
		}

		const winp = helpers.calcWinp(teamSeason);

		if (
			winp > bestWinp &&
			(teamSeason.season < g.get("season") || teamSeason.won >= mostWon)
		) {
			bestRecord = history.at(-1);
			bestWinp = winp;
			mostWon = teamSeason.won;
		}

		if (
			winp < worstWinp &&
			(teamSeason.season < g.get("season") || teamSeason.won >= mostLost)
		) {
			worstRecord = history.at(-1);
			worstWinp = winp;
			mostLost = teamSeason.lost;
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
	};
};

export const getHistory = async (
	teamSeasons: TeamSeason[],
	playersAll: Player[],
	gmHistory?: boolean,
) => {
	const teamHistory = getHistoryTeam(teamSeasons);

	const stats = bySport({
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ewa"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

	let players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"injury",
			"tid",
			"hof",
			"watch",
			"jerseyNumber",
			"retirableJerseyNumbers",
		],
		ratings: ["pos"],
		stats: ["season", "abbrev", ...stats],
	});

	// Not sure why this is necessary, but sometimes statsTids gets an entry but ratings doesn't
	players = players.filter(p => p.careerStats.gp > 0);

	for (const p of players) {
		p.lastYr = "";
		if (p.stats.length > 0) {
			p.lastYr = p.stats.at(-1).season.toString();
			if (gmHistory) {
				p.lastYr += ` ${p.stats.at(-1).abbrev}`;
			}
		}

		// Handle case where ratings don't exist
		p.pos = p.ratings.length > 0 ? p.ratings.at(-1).pos : "";
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
			(t.retiredJerseyNumbers || []).map(async row => {
				const ts = teamSeasons.find(ts => ts.season === row.seasonTeamInfo);
				const teamInfo = {
					colors: ts ? ts.colors : t.colors,
					name: ts ? ts.name : t.name,
					region: ts ? ts.region : t.region,
				};

				let name;
				let pos;
				let champSeasons: number[] = [];
				if (row.pid !== undefined) {
					const p = await idb.getCopy.players({ pid: row.pid }, "noCopyCache");
					if (p) {
						name = `${p.firstName} ${p.lastName}`;
						pos = getMostCommonPosition(p, inputs.tid);

						champSeasons = p.awards
							.filter(award => award.type === "Won Championship")
							.map(award => award.season)
							.sort();
					}
				}

				return {
					...row,
					teamInfo,
					name,
					pos,
					champSeasons,
				};
			}),
		);

		const retiredByPid: Record<number, string[]> = {};
		if (retiredJerseyNumbers) {
			for (const { pid, number } of retiredJerseyNumbers) {
				if (pid !== undefined) {
					if (!retiredByPid[pid]) {
						retiredByPid[pid] = [];
					}
					retiredByPid[pid].push(number);
				}
			}
		}

		const players = await idb.getCopies.players({
			statsTid: inputs.tid,
		});
		for (const p of players) {
			p.stats = p.stats.filter(row => row.tid === inputs.tid);
			const retirableJerseyNumbers: Record<string, string[]> = {};
			(p as any).retirableJerseyNumbers = retirableJerseyNumbers;
			for (const { jerseyNumber, playoffs, season } of p.stats) {
				if (
					!playoffs &&
					jerseyNumber !== undefined &&
					(!retiredByPid[p.pid] || !retiredByPid[p.pid].includes(jerseyNumber))
				) {
					if (!retirableJerseyNumbers[jerseyNumber]) {
						retirableJerseyNumbers[jerseyNumber] = [];
					}
					retirableJerseyNumbers[jerseyNumber].push(season);
				}
			}
		}

		const history = await getHistory(teamSeasons, players);

		const retiredJerseyNumbers2 = retiredJerseyNumbers.map(row => {
			let numRings = 0;
			for (const historyRow of history.history) {
				if (
					historyRow.playoffRoundsWon >= historyRow.numPlayoffRounds &&
					row.champSeasons.includes(historyRow.season)
				) {
					numRings += 1;
				}
			}

			return {
				name: row.name,
				number: row.number,
				pid: row.pid,
				pos: row.pos,
				score: row.score,
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
