import { idb, iterate } from "../db";
import { g, processPlayersHallOfFame } from "../util";
import type {
	UpdateEvents,
	Player,
	ViewInput,
	MinimalPlayerRatings,
} from "../../common/types";
import groupBy from "lodash/groupBy";
import { player } from "../core";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

export const getMostXPlayers = async ({
	filter,
	getValue,
}: {
	filter?: (p: Player) => boolean;
	getValue: (p: Player) => Most | undefined;
}) => {
	const LIMIT = 100;
	const playersAll: (Player<MinimalPlayerRatings> & {
		most: Most;
	})[] = [];

	await iterate(
		idb.league.transaction("players").store,
		undefined,
		undefined,
		p => {
			if (filter !== undefined && !filter(p)) {
				return;
			}

			const most = getValue(p);
			if (most === undefined) {
				return;
			}

			playersAll.push({
				...p,
				most,
			});

			if (playersAll.length > LIMIT) {
				playersAll.sort((a, b) => b.most.value - a.most.value);
				playersAll.pop();
			}
		},
	);

	const stats =
		process.env.SPORT === "basketball"
			? ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"]
			: ["gp", "keyStats", "av"];

	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"draft",
			"retiredYear",
			"statsTids",
			"hof",
			"born",
			"diedYear",
			"most",
		],
		ratings: ["ovr", "pos"],
		stats: ["season", "abbrev", "tid", ...stats],
		fuzz: true,
	});

	for (let i = 0; i < 100; i++) {
		if (players[i]) {
			players[i].rank = i + 1;
		}
	}

	return {
		players: processPlayersHallOfFame(players),
		stats,
	};
};

const playerValue = (p: Player<MinimalPlayerRatings>) => {
	let sum = 0;
	for (const ps of p.stats) {
		if (process.env.SPORT === "basketball") {
			sum += ps.per + ps.ewa;
		} else {
			sum += ps.av;
		}
	}

	return {
		value: sum,
	};
};

const updatePlayers = async (
	{ type }: ViewInput<"most">,
	updateEvents: UpdateEvents,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (updateEvents.includes("firstRun")) {
		let filter: Parameters<typeof getMostXPlayers>[0]["filter"];
		let getValue: Parameters<typeof getMostXPlayers>[0]["getValue"];
		let title: string;
		let description: string;
		const extraCols: {
			key: string | [string, string] | [string, string, string];
			colName: string;
		}[] = [];

		if (type === "games_no_playoffs") {
			title = "Most Games, No Playoffs";
			description =
				"These are the players who played the most career games while never making the playoffs.";

			filter = p =>
				p.stats.length > 0 && p.stats.filter(ps => ps.playoffs).length === 0;
			getValue = p => {
				let sum = 0;
				for (const ps of p.stats) {
					sum += ps.gp;
				}
				return { value: sum };
			};
		} else if (type === "teams") {
			title = "Most Teams";
			description = "These are the players who played for the most teams";
			extraCols.push({
				key: ["most", "value"],
				colName: "# Teams",
			});

			getValue = p => {
				const tids = p.stats.filter(s => s.gp > 0).map(s => s.tid);
				return { value: new Set(tids).size };
			};
		} else if (type === "oldest_former_players") {
			title = "Oldest Former Players";
			description = "These are the players who lived the longest.";
			extraCols.push(
				{
					key: ["most", "value"],
					colName: "Age",
				},
				{
					key: ["born", "year"],
					colName: "Born",
				},
				{
					key: "diedYear",
					colName: "Died",
				},
			);

			getValue = p => {
				const age =
					typeof p.diedYear === "number"
						? p.diedYear - p.born.year
						: g.get("season") - p.born.year;
				return { value: age };
			};
		} else if (type === "no_ring") {
			title = "Best Players Without a Ring";
			description =
				"These are the best players who never won a league championship.";

			filter = p => p.awards.every(award => award.type !== "Won Championship");
			getValue = playerValue;
		} else if (type === "no_mvp") {
			title = "Best Players Without an MVP";
			description = "These are the best players who never won an MVP award.";

			filter = p =>
				p.awards.every(award => award.type !== "Most Valuable Player");
			getValue = playerValue;
		} else if (type === "progs") {
			title = "Best Progs";
			description =
				"These are the players who had the biggest single season increases in ovr rating.";
			extraCols.push(
				{
					key: ["most", "extra", "season"],
					colName: "Season",
				},
				{
					key: ["most", "value"],
					colName: "Prog",
				},
			);

			filter = p => p.ratings.length > 1;
			getValue = p => {
				let maxProg = -Infinity;
				let maxSeason = p.ratings[0].season;
				for (let i = 1; i < p.ratings.length; i++) {
					const ovr = player.fuzzRating(p.ratings[i].ovr, p.ratings[i].fuzz);
					const prevOvr = player.fuzzRating(
						p.ratings[i - 1].ovr,
						p.ratings[i - 1].fuzz,
					);
					const prog = ovr - prevOvr;
					if (prog > maxProg) {
						maxProg = prog;
						maxSeason = p.ratings[i].season;
					}
				}
				return {
					value: maxProg,
					extra: {
						season: maxSeason,
					},
				};
			};
		} else if (type === "busts") {
			title = "Biggest Busts";
			description =
				"These are the players drafted with a top 5 pick who had the worst careers.";

			filter = p =>
				p.draft.round === 1 && p.draft.pick <= 5 && p.ratings.length > 4;
			getValue = p => {
				const value = playerValue(p).value;
				return { value: -value };
			};
		} else if (type === "steals") {
			title = "Biggest Steals";
			description =
				process.env.SPORT === "basketball"
					? "These are the undrafted players or second round picks who had the best careers."
					: "These are the undrafted players or 5th+ round picks who had the best careers.";

			filter = p =>
				p.draft.round === 0 ||
				(process.env.SPORT === "basketball"
					? p.draft.round >= 2
					: p.draft.round >= 5);
			getValue = playerValue;
		} else if (type === "earnings") {
			title = "Career Earnings";
			description =
				"These are the players who made the most money in their careers.";
			extraCols.push({
				key: ["most", "value"],
				colName: "Amount",
			});

			getValue = p => {
				let sum = 0;
				for (const salary of p.salaries) {
					sum += salary.amount;
				}
				return { value: sum };
			};
		} else if (type === "hall_of_good") {
			title = "Hall of Good";
			description =
				"These are the best retired players who did not make the Hall of Fame.";

			filter = p => p.retiredYear < Infinity && !p.hof;
			getValue = playerValue;
		} else if (type === "hall_of_trash") {
			title = "Hall of Trash";
			description =
				"These are the worst players who actually got enough playing time to show it.";

			getValue = p => {
				let min = 0;
				let valueTimesMin = 0;
				for (const ps of p.stats) {
					min += ps.min;
					valueTimesMin += ps.min * ps.per;
				}

				if (
					min > g.get("numGames") * g.get("quarterLength") * 4 &&
					(p.retiredYear === Infinity || p.ratings.length > 3)
				) {
					return { value: -valueTimesMin / min };
				}
			};
		} else if (type === "traded") {
			title = "Most Times Traded";
			description =
				"These are the players who were traded the most number of times in their careers.";
			extraCols.push({
				key: ["most", "value"],
				colName: "# Trades",
			});

			getValue = p => {
				if (!p.transactions) {
					return;
				}
				const value = p.transactions.filter(t => t.type === "trade").length;
				if (value === 0) {
					return;
				}

				return { value };
			};
		} else if (type === "one_team") {
			title = "Most Years on One Team";
			description =
				"These are the players who played the most seasons for a single team.";
			extraCols.push({
				key: ["most", "value"],
				colName: "# Seasons",
			});
			extraCols.push({
				key: ["most", "extra"],
				colName: "Team",
			});

			getValue = p => {
				let maxNumSeasons = 0;
				let maxAbbrev;
				let maxTid;
				const statsByTid = groupBy(
					p.stats.filter(ps => !ps.playoffs),
					ps => ps.tid,
				);
				for (const tid of Object.keys(statsByTid)) {
					const numSeasons = statsByTid[tid].length;
					if (numSeasons > maxNumSeasons) {
						maxNumSeasons = numSeasons;

						// Somehow propagate these through
						maxTid = parseInt(tid);
						maxAbbrev = g.get("teamAbbrevsCache")[maxTid];
					}
				}

				if (maxNumSeasons === 0) {
					return;
				}

				return {
					value: maxNumSeasons,
					extra: { abbrev: maxAbbrev, tid: maxTid },
				};
			};
		} else if (type === "oldest") {
			title = "Oldest to Play in a Game";
			description = "These are the oldest players who ever played in a game.";
			extraCols.push({
				key: ["most", "value"],
				colName: "Age",
			});

			getValue = p => {
				let maxAge = 0;
				for (const ps of p.stats) {
					if (ps.gp > 0) {
						const age = ps.season - p.born.year;
						if (age > maxAge) {
							maxAge = age;
						}
					}
				}

				if (maxAge === 0) {
					return;
				}

				return { value: maxAge };
			};
		} else if (type === "worst_injuries") {
			title = "Worst Injuries";
			description =
				"These are the players who experienced the largest ovr drops after injuries.";
			extraCols.push({
				key: ["most", "extra", "type"],
				colName: "Injury",
			});
			extraCols.push({
				key: ["most", "extra", "season"],
				colName: "Season",
			});
			extraCols.push({
				key: ["most", "value"],
				colName: "Ovr Drop",
			});

			getValue = p => {
				let maxOvrDrop = 0;
				let injuryType;
				let injurySeason;
				for (const injury of p.injuries) {
					if (injury.ovrDrop !== undefined && injury.ovrDrop > maxOvrDrop) {
						maxOvrDrop = injury.ovrDrop;

						// Somehow propagate these through
						injuryType = injury.type;
						injurySeason = injury.season;
					}
				}

				if (maxOvrDrop === 0) {
					return;
				}

				return {
					value: maxOvrDrop,
					extra: { type: injuryType, season: injurySeason },
				};
			};
		} else {
			throw new Error(`Unknown type "${type}"`);
		}

		const { players, stats } = await getMostXPlayers({
			filter,
			getValue,
		});

		return {
			description,
			extraCols,
			players,
			stats,
			title,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
