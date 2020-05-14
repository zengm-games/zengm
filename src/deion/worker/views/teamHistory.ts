import { idb } from "../db";
import { g } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updateTeamHistory = async (
	inputs: ViewInput<"teamHistory">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		inputs.abbrev !== state.abbrev
	) {
		let bestRecord;
		let worstRecord;
		let mostWon = -Infinity;
		let mostLost = -Infinity;

		const teamSeasons = await idb.getCopies.teamSeasons({
			tid: inputs.tid,
		});

		const history: {
			season: number;
			won: number;
			lost: number;
			tied?: number;
			playoffRoundsWon: number;
			numPlayoffRounds: number;
			numConfs: number;
			name?: string;
		}[] = [];

		let totalWon = 0;
		let totalLost = 0;
		let totalTied = 0;
		let playoffAppearances = 0;
		let championships = 0;

		for (const teamSeason of teamSeasons) {
			const numPlayoffRounds = g.get("numGamesPlayoffSeries", teamSeason.season)
				.length;
			history.push({
				season: teamSeason.season,
				won: teamSeason.won,
				lost: teamSeason.lost,
				tied: g.get("ties") ? teamSeason.tied : undefined,
				playoffRoundsWon: teamSeason.playoffRoundsWon,
				numPlayoffRounds,
				numConfs: g.get("confs", teamSeason.season).length,
				name:
					teamSeason.region && teamSeason.name
						? `${teamSeason.region} ${teamSeason.name}`
						: undefined,
			});
			totalWon += teamSeason.won;
			totalLost += teamSeason.lost;
			totalTied += teamSeason.tied;

			if (teamSeason.playoffRoundsWon >= 0) {
				playoffAppearances += 1;
			}

			if (teamSeason.playoffRoundsWon === numPlayoffRounds) {
				championships += 1;
			}

			const won = g.get("ties")
				? teamSeason.won + 0.5 * teamSeason.tied
				: teamSeason.won;
			const lost = g.get("ties")
				? teamSeason.lost + 0.5 * teamSeason.tied
				: teamSeason.lost;

			if (won > mostWon) {
				bestRecord = history[history.length - 1];
				mostWon = won;
			}

			if (lost > mostLost) {
				worstRecord = history[history.length - 1];
				mostLost = lost;
			}
		}

		history.reverse(); // Show most recent season first

		const stats =
			process.env.SPORT === "basketball"
				? ["gp", "min", "pts", "trb", "ast", "per", "ewa"]
				: ["gp", "keyStats", "av"];
		const playersAll = await idb.getCopies.players({
			statsTid: inputs.tid,
		});
		let players = await idb.getCopies.playersPlus(playersAll, {
			attrs: ["pid", "name", "injury", "tid", "hof", "watch"],
			ratings: ["pos"],
			stats: ["season", "abbrev", ...stats],
			tid: inputs.tid,
		});

		// Not sure why this is necessary, but sometimes statsTids gets an entry but ratings doesn't
		players = players.filter(p => p.careerStats.gp > 0);

		for (const p of players) {
			p.stats.reverse();

			for (let j = 0; j < p.stats.length; j++) {
				if (p.stats[j].abbrev === g.get("teamAbbrevsCache")[inputs.tid]) {
					p.lastYr = p.stats[j].season.toString();
					break;
				}
			}

			// Handle case where ratings don't exist
			p.pos = p.ratings.length > 0 ? p.ratings[p.ratings.length - 1].pos : "";
			delete p.ratings;
			delete p.stats;
		}

		return {
			abbrev: inputs.abbrev,
			history,
			players,
			stats,
			team: {
				name: g.get("teamNamesCache")[inputs.tid],
				region: g.get("teamRegionsCache")[inputs.tid],
				tid: inputs.tid,
			},
			totalWon,
			totalLost,
			totalTied,
			playoffAppearances,
			championships,
			bestRecord,
			worstRecord,
			tid: inputs.tid,
			ties: g.get("ties"),
		};
	}
};

export default updateTeamHistory;
