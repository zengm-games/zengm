import { idb, iterate } from "../db";
import {
	defaultGameAttributes,
	g,
	helpers,
	processPlayersHallOfFame,
} from "../util";
import type {
	UpdateEvents,
	Player,
	ViewInput,
	MinimalPlayerRatings,
} from "../../common/types";
import { groupBy } from "../../common/groupBy";
import { player } from "../core";
import { bySport, PLAYER } from "../../common";
import { getValueStatsRow } from "../core/player/checkJerseyNumberRetirement";
import goatFormula from "../util/goatFormula";
import orderBy from "lodash-es/orderBy";

type Most = {
	value: number;
	extra?: Record<string, unknown>;
};

type PlayersAll = (Player<MinimalPlayerRatings> & {
	most: Most;
})[];

export const getMostXPlayers = async ({
	filter,
	getValue,
	after,
	sortParams,
}: {
	filter?: (p: Player) => boolean;
	getValue: (p: Player) => Most | undefined;
	after?: (most: Most) => Promise<Most> | Most;
	sortParams?: any;
}) => {
	const LIMIT = 100;
	const playersAll: PlayersAll = [];

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
			playersAll.sort((a, b) => b.most.value - a.most.value);

			if (playersAll.length > LIMIT) {
				playersAll.pop();
			}
		},
	);

	const stats = bySport({
		basketball: ["gp", "min", "pts", "trb", "ast", "per", "ewa", "ws", "ws48"],
		football: ["gp", "keyStats", "av"],
		hockey: ["gp", "keyStats", "ops", "dps", "ps"],
	});

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
			"jerseyNumber",
			"awards",
		],
		ratings: ["ovr", "pos"],
		stats: ["season", "abbrev", "tid", ...stats],
		fuzz: true,
	});

	const ordered = sortParams ? orderBy(players, ...sortParams) : players;
	for (let i = 0; i < 100; i++) {
		if (ordered[i]) {
			ordered[i].rank = i + 1;

			if (after) {
				ordered[i].most = await after(ordered[i].most);
			}
		}
	}

	return {
		players: processPlayersHallOfFame(ordered),
		stats,
	};
};

const playerValue = (p: Player<MinimalPlayerRatings>) => {
	let sum = 0;
	for (const ps of p.stats) {
		sum += getValueStatsRow(ps);
	}

	return {
		value: sum,
	};
};

// Should actually be using getTeamInfoBySeason
const tidAndSeasonToAbbrev = async (most: Most) => {
	let abbrev;

	const { season, tid } = most.extra as any;
	const teamSeason = await idb.league
		.transaction("teamSeasons")
		.store.index("season, tid")
		.get([season, tid]);
	if (teamSeason) {
		abbrev = teamSeason.abbrev;
	}

	if (abbrev === undefined) {
		if (season < g.get("startingSeason")) {
			const teamSeason = await idb.league
				.transaction("teamSeasons")
				.store.index("season, tid")
				.get([g.get("startingSeason"), tid]);
			if (teamSeason) {
				abbrev = teamSeason.abbrev;
			}
		}

		abbrev = g.get("teamInfoCache")[tid]?.abbrev;
	}

	return {
		...most,
		extra: {
			...most.extra,
			tid,
			abbrev,
		},
	};
};

const updatePlayers = async (
	{ arg, type }: ViewInput<"most">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// In theory should update more frequently, but the list is potentially expensive to update and rarely changes
	if (
		updateEvents.includes("firstRun") ||
		type !== state.type ||
		(type === "goat" && updateEvents.includes("g.goatFormula"))
	) {
		let filter: Parameters<typeof getMostXPlayers>[0]["filter"];
		let getValue: Parameters<typeof getMostXPlayers>[0]["getValue"];
		let after: Parameters<typeof getMostXPlayers>[0]["after"];
		let sortParams: any;
		let title: string;
		let description: string | undefined;
		const extraCols: {
			key: string | [string, string] | [string, string, string];
			colName: string;
		}[] = [];
		let extraProps: any;

		if (type === "at_pick") {
			if (arg === undefined) {
				throw new Error("Pick must be specified in the URL");
			}

			if (arg === "undrafted") {
				title = "Best Undrafted Players";
			} else {
				title = `Best Players Drafted at Pick ${arg}`;
			}
			description = `<a href="${helpers.leagueUrl([
				"frivolities",
				"draft_position",
			])}">Other picks</a>`;

			let round: number;
			let pick: number;
			if (arg === "undrafted") {
				round = 0;
				pick = 0;
			} else {
				const parts = arg.split("-");
				round = parseInt(parts[0]);
				pick = parseInt(parts[1]);

				if (Number.isNaN(round) || Number.isNaN(pick)) {
					throw new Error("Invalid pick");
				}
			}

			filter = p =>
				p.tid !== PLAYER.UNDRAFTED &&
				p.draft.round === round &&
				p.draft.pick === pick;
			getValue = playerValue;
		} else if (type === "games_injured") {
			title = "Most Games Injured";
			description = "Players with the most total games missed due to injury.";
			extraCols.push({
				key: ["most", "value"],
				colName: "Games",
			});

			filter = p => p.injuries.length > 0;
			getValue = p => {
				let sum = 0;
				for (const ps of p.injuries) {
					sum += ps.games;
				}
				return { value: sum };
			};
		} else if (type === "games_no_playoffs") {
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
		} else if (type === "goat") {
			title = "GOAT Lab";
			description =
				"Define your own formula to rank the greatest players of all time.";
			extraCols.push({
				key: ["most", "value"],
				colName: "GOAT",
			});
			extraProps = {
				goatFormula: g.get("goatFormula") ?? goatFormula.DEFAULT_FORMULA,
				awards: goatFormula.AWARD_VARIABLES,
				stats: goatFormula.STAT_VARIABLES,
			};

			getValue = (p: Player<MinimalPlayerRatings>) => {
				let value = 0;
				try {
					value = goatFormula.evaluate(p);
				} catch (error) {}

				return {
					value,
				};
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
			if (g.get("challengeNoRatings")) {
				description +=
					' Because you\'re using the "no visible ratings" challenge mode, only retired players are shown here.';
			}
			extraCols.push(
				{
					key: ["most", "extra", "season"],
					colName: "Season",
				},
				{
					key: ["most", "extra", "age"],
					colName: "Age",
				},
				{
					key: ["most", "value"],
					colName: "Prog",
				},
			);

			filter = p =>
				p.ratings.length > 1 &&
				(!g.get("challengeNoRatings") || p.tid === PLAYER.RETIRED);
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
						age: maxSeason - p.born.year,
					},
				};
			};
		} else if (type === "busts") {
			title = "Biggest Busts";
			description =
				"These are the players drafted with a top 5 pick who had the worst careers.";
			extraCols.push({
				key: ["most", "extra"],
				colName: "Team",
			});

			filter = p =>
				p.draft.round === 1 &&
				p.draft.pick <= 5 &&
				g.get("season") - p.draft.year >= 5 &&
				p.draft.year >= g.get("startingSeason") - 3;
			getValue = p => {
				const value = playerValue(p).value;

				return {
					value: -value,
					extra: { tid: p.draft.tid, season: p.draft.year },
				};
			};
			after = tidAndSeasonToAbbrev;
		} else if (type === "steals") {
			title = "Biggest Steals";
			description = bySport({
				basketball:
					"These are the undrafted players or second round picks who had the best careers.",
				football:
					"These are the undrafted players or 5th+ round picks who had the best careers.",
				hockey:
					"These are the undrafted players or 3rd+ round picks who had the best careers.",
			});
			extraCols.push({
				key: ["most", "extra"],
				colName: "Team",
			});

			filter = p =>
				p.draft.round === 0 ||
				bySport({
					basketball: p.draft.round >= 2,
					football: p.draft.round >= 5,
					hockey: p.draft.round >= 3,
				});
			getValue = p => {
				const value = playerValue(p).value;

				return {
					value,
					extra: { tid: p.draft.tid, season: p.draft.year },
				};
			};
			after = tidAndSeasonToAbbrev;
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
		} else if (type === "hall_of_shame") {
			title = "Hall of Shame";
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
					min >
						g.get("numGames") *
							(g.get("quarterLength") > 0
								? g.get("quarterLength")
								: defaultGameAttributes.quarterLength) *
							g.get("numPeriods") &&
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
				key: ["most", "extra", "gp"],
				colName: "stat:gp",
			});
			extraCols.push({
				key: ["most", "extra"],
				colName: "Team",
			});

			getValue = p => {
				let maxNumSeasons = 0;
				let maxTid;
				let maxGP;
				let maxSeason; // Last season, for historical abbrev computation
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

						maxGP = 0;
						for (const ps of statsByTid[tid]) {
							maxGP += ps.gp;
							maxSeason = ps.season;
						}
					}
				}

				if (maxNumSeasons === 0) {
					return;
				}

				return {
					value: maxNumSeasons,
					extra: { gp: maxGP, tid: maxTid, season: maxSeason },
				};
			};
			after = tidAndSeasonToAbbrev;
		} else if (type === "oldest") {
			title = "Oldest to Play in a Game";
			description = "These are the oldest players who ever played in a game.";
			extraCols.push({
				key: ["most", "value"],
				colName: "Age",
			});
			extraCols.push({
				key: ["most", "extra", "season"],
				colName: "Season",
			});
			extraCols.push({
				key: ["most", "extra"],
				colName: "Team",
			});
			extraCols.push({
				key: ["most", "extra", "ovr"],
				colName: "Ovr",
			});

			getValue = p => {
				let maxAge = 0;
				let season: number | undefined;
				let tid: number | undefined;
				for (const ps of p.stats) {
					if (ps.gp > 0) {
						const age = ps.season - p.born.year;
						if (age > maxAge) {
							maxAge = age;
							season = ps.season;
							tid = ps.tid;
						}
					}
				}

				if (season === undefined) {
					return;
				}

				let ovr: number | undefined;
				const ratings = p.ratings.find(pr => pr.season === season);
				if (ratings) {
					ovr = player.fuzzRating(ratings.ovr, ratings.fuzz);
				}

				return {
					value: maxAge,
					extra: {
						season,
						ovr,
						tid,
					},
				};
			};
			after = tidAndSeasonToAbbrev;
		} else if (type === "oldest_peaks" || type === "youngest_peaks") {
			const oldest = type === "oldest_peaks";

			title = `${oldest ? "Oldest" : "Youngest"} Peaks`;
			description = `These are the players who peaked in ovr at the ${
				oldest ? "oldest" : "youngest"
			} age (min 5 seasons in career${oldest ? "" : " and 30+ years old"}).`;
			extraCols.push({
				key: ["most", "extra", "age"],
				colName: "Age",
			});
			extraCols.push({
				key: ["most", "extra", "season"],
				colName: "Season",
			});
			extraCols.push({
				key: ["most", "extra"],
				colName: "Team",
			});
			extraCols.push({
				key: ["most", "extra", "ovr"],
				colName: "Ovr",
			});

			sortParams = [
				["most.value", "most.extra.ovr"],
				["desc", "desc"],
			];

			getValue = p => {
				if (p.ratings.length < 5) {
					return;
				}

				if (!oldest) {
					// Skip players who are not yet 30 years old
					const ratings = p.ratings.at(-1);
					if (!ratings) {
						return;
					}
					const age = ratings.season - p.born.year;
					if (age < 30) {
						return;
					}
				}

				// Skip players who were older than 25 when league started
				const ratings = p.ratings[0];
				if (!ratings) {
					return;
				}
				const age = ratings.season - p.born.year;
				if (age > 25 && ratings.season === g.get("startingSeason")) {
					return;
				}

				let maxOvr = -Infinity;
				let season: number | undefined;
				for (const ratings of p.ratings) {
					const ovr = player.fuzzRating(ratings.ovr, ratings.fuzz);
					// gt vs gte makes sense if you think about oldest vs youngest, we're searching in order here
					if ((oldest && ovr >= maxOvr) || (!oldest && ovr > maxOvr)) {
						maxOvr = ovr;
						season = ratings.season;
					}
				}

				if (season === undefined) {
					return;
				}

				const maxAge = season - p.born.year;

				let tid: number | undefined;
				for (const ps of p.stats) {
					if (season === ps.season) {
						tid = ps.tid;
					} else if (season < ps.season) {
						break;
					}
				}

				if (tid === undefined) {
					return;
				}

				return {
					value: oldest ? maxAge : -maxAge,
					extra: {
						age: maxAge,
						season,
						ovr: maxOvr,
						tid,
					},
				};
			};
			after = tidAndSeasonToAbbrev;
		} else if (type === "worst_injuries") {
			title = "Worst Injuries";
			description =
				"These are the players who experienced the largest ovr drops after injuries.";
			if (g.get("challengeNoRatings")) {
				description +=
					' Because you\'re using the "no visible ratings" challenge mode, only retired players are shown here.';
			}
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

			filter = p =>
				p.injuries.length > 0 &&
				(!g.get("challengeNoRatings") || p.tid === PLAYER.RETIRED);
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
		} else if (type === "jersey_number") {
			if (arg === undefined) {
				throw new Error("Jersey number must be specified in the URL");
			}

			title = `Best Players With Jersey Number ${arg}`;
			description = `These are the best players who spent the majority of their career wearing #${arg}. <a href="${helpers.leagueUrl(
				["frivolities", "jersey_numbers"],
			)}">Other jersey numbers.</a>`;

			filter = p => helpers.getJerseyNumber(p, "mostCommon") === arg;
			getValue = playerValue;
		} else if (type === "country") {
			if (arg === undefined) {
				throw new Error("Country must be specified in the URL");
			}

			title = `Best Players From ${arg}`;
			description = `These are the best players from the country ${arg}. <a href="${helpers.leagueUrl(
				["frivolities", "countries"],
			)}">Other countries.</a>`;

			filter = p => helpers.getCountry(p.born.loc) === arg;
			getValue = playerValue;
		} else if (type === "college") {
			if (arg === undefined) {
				throw new Error("College must be specified in the URL");
			}

			title = `Best Players From ${arg}`;
			description = `These are the best players from the college ${arg}. <a href="${helpers.leagueUrl(
				["frivolities", "colleges"],
			)}">Other colleges.</a>`;

			filter = p => {
				const college = p.college && p.college !== "" ? p.college : "None";
				return college === arg;
			};
			getValue = playerValue;
		} else {
			throw new Error(`Unknown type "${type}"`);
		}

		const { players, stats } = await getMostXPlayers({
			filter,
			getValue,
			after,
			sortParams,
		});

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			description,
			extraCols,
			extraProps,
			players,
			stats,
			title,
			type,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePlayers;
