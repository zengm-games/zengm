import {
	PLAYER,
	PHASE,
	processPlayerStats as processPlayerStats2,
} from "../../../common";
import { player, trade } from "../../core";
import { g, helpers } from "../../util";
import type {
	Player,
	PlayerFiltered,
	PlayerStatType,
	PlayersPlusOptions,
} from "../../../common/types";

type PlayersPlusOptionsRequired = {
	season?: number;
	tid?: number;
	attrs: string[];
	ratings: string[];
	stats: string[];
	playoffs: boolean;
	regularSeason: boolean;
	showNoStats: boolean;
	showRookies: boolean;
	showRetired: boolean;
	fuzz: boolean;
	oldStats: boolean;
	numGamesRemaining: number;
	statType: PlayerStatType;
	mergeStats: boolean;
};

const processAttrs = (
	output: PlayerFiltered,
	p: Player,
	{ attrs, fuzz, numGamesRemaining, season, tid }: PlayersPlusOptionsRequired,
) => {
	const getSalary = () => {
		let total = 0;
		const s = season ?? g.get("season");

		for (const salary of p.salaries) {
			if (salary.season === s) {
				total += salary.amount / 1000;
			}
		}

		return total;
	};

	for (const attr of attrs) {
		if (attr === "age") {
			const s = season ?? g.get("season");
			output.age = s - p.born.year;
		} else if (attr === "ageAtDeath") {
			output.ageAtDeath =
				typeof p.diedYear === "number" ? p.diedYear - p.born.year : null;
		} else if (attr === "diedYear") {
			// Non-dead players wil not have any diedYear property
			output.diedYear = typeof p.diedYear === "number" ? p.diedYear : null;
		} else if (attr === "draft") {
			output.draft = { ...p.draft, age: p.draft.year - p.born.year };

			if (fuzz) {
				output.draft.ovr = player.fuzzRating(
					output.draft.ovr,
					p.ratings[0].fuzz,
				);
				output.draft.pot = player.fuzzRating(
					output.draft.pot,
					p.ratings[0].fuzz,
				);
			}

			// Inject abbrevs
			output.draft.abbrev = g.get("teamInfoCache")[output.draft.tid]?.abbrev;
			output.draft.originalAbbrev = g.get("teamInfoCache")[
				output.draft.originalTid
			]?.abbrev;
		} else if (attr === "contract") {
			if (g.get("season") === season || season === undefined) {
				output.contract = helpers.deepCopy(p.contract);
				output.contract.amount /= 1000; // [millions of dollars]
			} else {
				output.contract = {
					amount: getSalary(),
					exp: season,
				};
			}
		} else if (attr === "cashOwed") {
			output.cashOwed =
				(player.contractSeasonsRemaining(p.contract.exp, numGamesRemaining) *
					p.contract.amount) /
				1000; // [millions of dollars]
		} else if (attr === "abbrev") {
			output.abbrev = helpers.getAbbrev(p.tid);
		} else if (
			attr === "injury" &&
			season !== undefined &&
			season < g.get("season")
		) {
			output.injury = {
				type: "Healthy",
				gamesRemaining: 0,
			};
		} else if (attr === "salary") {
			output.salary = getSalary();
		} else if (attr === "salaries") {
			output.salaries = helpers.deepCopy(p.salaries).map(salary => {
				salary.amount /= 1000;
				return salary;
			});
		} else if (attr === "salariesTotal") {
			output.salariesTotal = output.salaries.reduce(
				(memo: number, salary: { amount: number }) => memo + salary.amount,
				0,
			);
		} else if (attr === "name") {
			output.name = `${p.firstName} ${p.lastName}`;
		} else if (attr === "nameAbbrev") {
			if (p.lastName === "") {
				output.nameAbbrev = p.firstName;
			} else {
				output.nameAbbrev = `${p.firstName
					.replace(/"/g, "")
					.split(" ")
					.map(s => s[0])
					.filter(s => s !== undefined)
					.join(".")}. ${p.lastName}`;
			}
		} else if (attr === "untradable") {
			Object.assign(output, trade.isUntradable(p));
		} else if (attr === "numBrothers") {
			output.numBrothers = p.relatives.filter(
				rel => rel.type === "brother",
			).length;
		} else if (attr === "numFathers") {
			output.numFathers = p.relatives.filter(
				rel => rel.type === "father",
			).length;
		} else if (attr === "numSons") {
			output.numSons = p.relatives.filter(rel => rel.type === "son").length;
		} else if (attr === "numAllStar") {
			output.numAllStar = p.awards.filter(a => a.type === "All-Star").length;
		} else if (attr === "latestTransaction") {
			let transaction;
			if (p.transactions && p.transactions.length > 0) {
				if (season === undefined || season >= g.get("season")) {
					transaction = p.transactions[p.transactions.length - 1];
				} else {
					// Iterate over transactions backwards, find most recent one that was before the supplied season
					for (let i = p.transactions.length - 1; i >= 0; i--) {
						if (tid !== undefined && p.transactions[i].tid !== tid) {
							continue;
						}

						if (
							p.transactions[i].season < season ||
							(p.transactions[i].season === season &&
								p.transactions[i].phase <= PHASE.PLAYOFFS)
						) {
							transaction = p.transactions[i];
						}
					}
				}
			}

			if (transaction) {
				if (transaction.type === "draft") {
					const draftName =
						transaction.phase === PHASE.FANTASY_DRAFT
							? `${transaction.season} fantasy draft`
							: transaction.phase === PHASE.EXPANSION_DRAFT
							? `${transaction.season} expansion draft`
							: `<a href="${helpers.leagueUrl([
									"draft_history",
									transaction.season,
							  ])}">${transaction.season} draft</a>`;

					output.latestTransaction = `${helpers.ordinal(
						// @ts-ignore
						transaction.pickNum,
					)} pick in the ${draftName}`;
				} else if (transaction.type === "freeAgent") {
					output.latestTransaction = `Free agent signing in ${transaction.season}`;
				} else if (transaction.type === "trade") {
					// @ts-ignore
					const abbrev = g.get("teamInfoCache")[transaction.fromTid]?.abbrev;
					const url =
						transaction.eid !== undefined
							? helpers.leagueUrl(["trade_summary", transaction.eid])
							: helpers.leagueUrl(["roster", abbrev, transaction.season]);
					output.latestTransaction = `Trade with <a href="${url}">${abbrev} in ${transaction.season}</a>`;
				} else if (transaction.type === "godMode") {
					output.latestTransaction = `God Mode in ${transaction.season}`;
				} else if (transaction.type === "import") {
					output.latestTransaction = `Imported in ${transaction.season}`;
				}
			} else {
				output.latestTransaction = "";
			}
		} else if (attr === "latestTransactionSeason") {
			if (p.transactions && p.transactions.length > 0) {
				output.latestTransactionSeason =
					p.transactions[p.transactions.length - 1].season;
			} else {
				output.latestTransactionSeason = undefined;
			}
		} else if (attr === "jerseyNumber") {
			if (p.stats.length === 0) {
				output.jerseyNumber = undefined;
			} else if (p.tid === PLAYER.RETIRED) {
				output.jerseyNumber = helpers.getJerseyNumber(p, "mostCommon");
			} else {
				// Latest
				output.jerseyNumber = p.stats[p.stats.length - 1].jerseyNumber;
			}
		} else if (attr === "experience") {
			const seasons = new Set();
			for (const row of p.stats) {
				if (row.min > 0 && (season === undefined || row.season <= season)) {
					seasons.add(row.season);
				}
			}
			output.experience = seasons.size;
		} else {
			// Several other attrs are not primitive types, so deepCopy
			// @ts-ignore
			output[attr] = helpers.deepCopy(p[attr]);
		}
	}
};

const processRatings = (
	output: PlayerFiltered,
	p: Player,
	{
		fuzz,
		ratings,
		showRetired,
		stats,
		season,
		tid,
	}: PlayersPlusOptionsRequired,
) => {
	let playerRatings = p.ratings;

	// If we're returning all seasons for a specific team, filter ratings to match stats
	if (season === undefined && tid !== undefined) {
		const statsSeasons = p.stats
			.filter(ps => ps.tid === tid)
			.map(ps => ps.season);
		playerRatings = playerRatings.filter(pr =>
			statsSeasons.includes(pr.season),
		);
	}

	if (season !== undefined) {
		// Can't just check season alone, because of injury records. So find the last record in playerRatings that matches the season
		const rowIndex = playerRatings.reduceRight((foundIndex, pr, i) => {
			if (pr.season === season && foundIndex === undefined) {
				return i;
			}

			return foundIndex;
		}, undefined);
		playerRatings = rowIndex === undefined ? [] : [playerRatings[rowIndex]];
	}

	// Show next draft class's prospects, after the current draft has ended
	if (
		season === g.get("season") &&
		p.draft.year === g.get("season") + 1 &&
		g.get("phase") > PHASE.DRAFT &&
		playerRatings.length === 0
	) {
		playerRatings = [
			{
				...p.ratings[p.ratings.length - 1],
			},
		];
	}

	output.ratings = playerRatings.map(pr => {
		const row: any = {};

		for (const attr of ratings) {
			if (attr === "skills") {
				row.skills = helpers.deepCopy(pr.skills);
			} else if (attr === "dovr" || attr === "dpot") {
				// Handle dovr and dpot - if there are previous ratings, calculate the fuzzed difference
				const cat = attr.slice(1); // either ovr or pot

				// Find previous season's final ratings, knowing that both this year and last year could have multiple entries due to injuries
				let prevRow;
				for (let j = 0; j < p.ratings.length; j++) {
					if (p.ratings[j].season < pr.season) {
						prevRow = p.ratings[j];
					}
				}

				if (prevRow) {
					row[attr] =
						player.fuzzRating(pr[cat], pr.fuzz) -
						player.fuzzRating(prevRow[cat], prevRow.fuzz);
				} else {
					row[attr] = 0;
				}
			} else if (attr === "age") {
				row.age = pr.season - p.born.year;
			} else if (attr === "abbrev" || attr === "tid") {
				// Find the last stats entry for that season, and use that to determine the team. Requires tid to be requested from stats (otherwise, need to refactor stats fetching to happen outside of processStats)
				if (!stats.includes("tid")) {
					throw new Error(
						'Crazy I know, but if you request "abbrev" or "tid" from ratings, you must also request "tid" from stats',
					);
				}

				let tidTemp;

				for (const ps of output.stats) {
					if (ps.season === pr.season && ps.playoffs === false) {
						tidTemp = ps.tid;
					}
				}

				if (attr === "abbrev") {
					if (tidTemp !== undefined) {
						row.abbrev = helpers.getAbbrev(tidTemp);
					} else {
						row.abbrev = "";
					}
				} else {
					row.tid = tidTemp;
				}
			} else if (attr === "ovrs" || attr === "pots") {
				row[attr] = { ...pr[attr] };

				if (fuzz) {
					for (const key of Object.keys(row[attr])) {
						row[attr][key] = player.fuzzRating(row[attr][key], pr.fuzz);
					}
				}
			} else if (
				fuzz &&
				attr !== "fuzz" &&
				attr !== "season" &&
				attr !== "hgt" &&
				attr !== "pos" &&
				attr !== "injuryIndex"
			) {
				row[attr] = player.fuzzRating(pr[attr], pr.fuzz);
			} else {
				row[attr] = pr[attr];
			}
		}

		return row;
	});

	if (season !== undefined) {
		output.ratings = output.ratings[output.ratings.length - 1];

		if (output.ratings === undefined && showRetired) {
			const row: any = {};

			for (const attr of ratings) {
				if (attr === "skills") {
					row.skills = [];
				} else if (attr === "age") {
					row.age = season - p.born.year;
				} else if (attr === "pos") {
					row.pos = p.ratings[p.ratings.length - 1].pos;
				} else if (attr === "abbrev") {
					row.abbrev = "";
				} else {
					row[attr] = 0;
				}
			}

			output.ratings = row;
		}
	}
};

const weightByMinutes =
	process.env.SPORT === "basketball"
		? [
				"per",
				"astp",
				"blkp",
				"drbp",
				"orbp",
				"stlp",
				"trbp",
				"usgp",
				"drtg",
				"ortg",
				"obpm",
				"dbpm",
				"bpm",
		  ]
		: [];

const reduceCareerStats = (
	careerStats: any[],
	attr: string,
	playoffs: boolean,
) => {
	return careerStats
		.filter(cs => cs.playoffs === playoffs)
		.reduce(
			(memo, cs) => {
				if (cs[attr] === undefined) {
					return memo;
				}

				const num = weightByMinutes.includes(attr)
					? cs[attr] * cs.min
					: cs[attr];

				if (attr.endsWith("Lng")) {
					return num > memo ? num : memo;
				}

				if (attr.endsWith("Max")) {
					if (num === undefined || num === null) {
						return memo;
					}

					return memo === null || num[0] > memo[0]
						? [num[0], num[1], helpers.getAbbrev(cs.tid), cs.tid, cs.season]
						: memo;
				}

				return memo + num;
			},
			attr.endsWith("Max") ? null : 0,
		);
};

const getPlayerStats = (
	playerStats: any[],
	season: number | undefined,
	tid: number | undefined,
	playoffs: boolean,
	regularSeason: boolean,
	mergeStats: boolean,
) => {
	const rows = helpers.deepCopy(
		playerStats.filter(ps => {
			// Not sure why this is needed, but might fix an error someone reported
			if (!ps) {
				return false;
			}

			const seasonCheck = season === undefined || ps.season === season;
			const tidCheck = tid === undefined || ps.tid === tid;
			const playoffsCheck =
				(playoffs && ps.playoffs) || (regularSeason && !ps.playoffs);
			return seasonCheck && tidCheck && playoffsCheck;
		}),
	);

	const actuallyMergeStats =
		mergeStats &&
		regularSeason &&
		!playoffs &&
		tid === undefined &&
		rows.length > 1;

	if (actuallyMergeStats) {
		const seasons = Array.from(new Set(rows.map(row => row.season)));
		if (seasons.length !== rows.length) {
			// Multiple entries when we want one row of output per season... maybe player was traded during season?
			return seasons.map(season2 => {
				const rowsTemp = rows.filter(row => row.season === season2);

				// Aggregate annual stats and ignore other things
				const ignoredKeys = [
					"season",
					"tid",
					"yearsWithTeam",
					"playoffs",
					"jerseyNumber",
				];
				const statSums: any = {};
				const attrs =
					rowsTemp.length > 0 ? Object.keys(rowsTemp[rowsTemp.length - 1]) : [];

				for (const attr of attrs) {
					if (!ignoredKeys.includes(attr)) {
						statSums[attr] = reduceCareerStats(rowsTemp, attr, false);
					}
				}

				// Special case for some variables, weight by minutes
				for (const attr of weightByMinutes) {
					if (statSums.hasOwnProperty(attr)) {
						statSums[attr] /= statSums.min;
					}
				}

				// Defaults from latest entry
				for (const attr of ignoredKeys) {
					statSums[attr] = rowsTemp[rowsTemp.length - 1][attr];
				}

				return statSums;
			});
		}
	}

	return rows;
};

const processPlayerStats = (
	p: any,
	statSums: any,
	stats: string[],
	statType: PlayerStatType,
) => {
	const output = processPlayerStats2(statSums, stats, statType, p.born.year);

	// More common stuff between basketball/football could be moved here... abbrev is just special cause it needs to run on the worker
	if (stats.includes("abbrev")) {
		if (statSums.tid === undefined) {
			output.abbrev = helpers.getAbbrev(
				p.tid === PLAYER.UNDRAFTED ? PLAYER.UNDRAFTED : PLAYER.FREE_AGENT,
			);
		} else {
			output.abbrev = helpers.getAbbrev(statSums.tid);
		}
	}

	if (stats.includes("tid")) {
		if (statSums.tid === undefined) {
			output.tid = p.tid;
		} else {
			output.tid = statSums.tid;
		}
	}

	return output;
};

const processStats = (
	output: PlayerFiltered,
	p: Player,
	{
		mergeStats,
		playoffs,
		regularSeason,
		season,
		tid,
		showNoStats,
		oldStats,
		statType,
		stats,
	}: PlayersPlusOptionsRequired,
) => {
	// Only season(s) and team in question
	let playerStats = getPlayerStats(
		p.stats,
		season,
		tid,
		playoffs,
		regularSeason,
		mergeStats,
	);

	// oldStats crap
	if (oldStats && season !== undefined && playerStats.length === 0) {
		const oldSeason = season - 1;
		playerStats = getPlayerStats(
			p.stats,
			oldSeason,
			tid,
			playoffs,
			regularSeason,
			mergeStats,
		);
	}

	if (playerStats.length === 0 && showNoStats) {
		if (g.get("season") === season) {
			// Player is on a team but has not played with them yet (like this is the offseason before their first season with team) - override blank jersey number
			playerStats.push({
				jerseyNumber: helpers.getJerseyNumber(p),
			});
		} else {
			playerStats.push({});
		}
	}

	const careerStats: any[] = [];
	output.stats = playerStats.map(ps => {
		if (season === undefined) {
			careerStats.push(ps);
		}

		return processPlayerStats(p, ps, stats, statType);
	});

	if (
		season !== undefined &&
		((playoffs && !regularSeason) || (!playoffs && regularSeason))
	) {
		// Take last value, in case player was traded/signed to team twice in a season
		output.stats = output.stats[output.stats.length - 1];
	} else if (season === undefined) {
		// Aggregate annual stats and ignore other things
		const ignoredKeys = ["season", "tid", "yearsWithTeam", "jerseyNumber"];
		const statSums: any = {};
		const statSumsPlayoffs: any = {};
		const attrs =
			careerStats.length > 0
				? Object.keys(careerStats[careerStats.length - 1])
				: [];

		for (const attr of attrs) {
			if (!ignoredKeys.includes(attr)) {
				statSums[attr] = reduceCareerStats(careerStats, attr, false);
				statSumsPlayoffs[attr] = reduceCareerStats(careerStats, attr, true);
			}
		}

		// Special case for some variables, weight by minutes
		for (const attr of weightByMinutes) {
			if (statSums.hasOwnProperty(attr)) {
				statSums[attr] /= statSums.min;
			}

			if (statSumsPlayoffs.hasOwnProperty(attr)) {
				statSumsPlayoffs[attr] /= statSumsPlayoffs.min;
			}
		}

		if (regularSeason) {
			output.careerStats = processPlayerStats(p, statSums, stats, statType);
		}

		if (playoffs) {
			output.careerStatsPlayoffs = processPlayerStats(
				p,
				statSumsPlayoffs,
				stats,
				statType,
			);
		}
	}
};

const processPlayer = (p: Player, options: PlayersPlusOptionsRequired) => {
	const {
		attrs,
		ratings,
		season,
		showNoStats,
		showRetired,
		showRookies,
	} = options;

	const output: any = {};

	if (ratings.length > 0 && season !== undefined) {
		const hasRatingsSeason = p.ratings.some(
			r =>
				r.season === season ||
				(r.season === season + 1 && g.get("phase") > PHASE.DRAFT),
		);

		if (!hasRatingsSeason && !showRetired) {
			return;
		}
	}

	const keepWithNoStats =
		(showRookies &&
			p.draft.year >= g.get("season") &&
			(season === g.get("season") || season === undefined)) ||
		(showNoStats && (season === undefined || season > p.draft.year));

	if (options.stats.length > 0 || keepWithNoStats) {
		processStats(output, p, options);

		// Only add a player if filterStats finds something (either stats that season, or options overriding that check)
		if (output.stats === undefined && !keepWithNoStats) {
			return;
		}
	}

	// processRatings must be after processStats for abbrev hack
	if (ratings.length > 0) {
		processRatings(output, p, options);

		// This should be mostly redundant with hasRatingsSeason above
		if (output.ratings === undefined) {
			return;
		}
	}

	if (attrs.length > 0) {
		processAttrs(output, p, options);
	}

	return output;
};

/**
 * Retrieve a filtered copy of a player object, or an array of filtered player objects.
 *
 * This can be used to retrieve information about a certain season, compute average statistics from the raw data, etc.
 *
 * For a player object (p), create an object suitible for output based on the appropriate options, most notably a options.season and options.tid to find rows in of stats and ratings, and options.attributes, options.stats, and options.ratings to extract teh desired information. In the output, the attributes keys will be in the root of the object. There will also be stats and ratings properties containing filtered stats and ratings objects.
 *
 * If options.season is undefined, then the stats and ratings objects will contain lists of objects for each season and options.tid is ignored. Then, there will also be a careerStats property in the output object containing an object with career averages.
 *
 * There are several more options (all described below) which can make things pretty complicated, but most of the time, they are not needed.
 *
 * @memberOf core.player
 * @param {Object|Array.<Object>} players Player object or array of player objects to be filtered.
 * @param {Object} options Options, as described below.
 * @param {number=} options.season Season to retrieve stats/ratings for. If undefined, return stats/ratings for all seasons in a list as well as career totals in player.careerStats.
 * @param {number=} options.tid Team ID to retrieve stats for. This is useful in the case where a player played for multiple teams in a season. Eventually, there should be some way to specify whether the stats for multiple teams in a single season should be merged together or not. For now, if this is undefined, it just picks the first entry, which is clearly wrong.
 * @param {Array.<string>=} options.attrs List of player attributes to include in output.
 * @param {Array.<string>=} options.ratings List of player ratings to include in output.
 * @param {Array.<string>=} options.stats List of player stats to include in output.
 * @param {boolean=} options.playoffs Boolean representing whether to return playoff stats or not; default is false.
 * @param {boolean=} options.regularSeason Boolean representing whether to return regular season stats or not; default is true.
 * @param {boolean=} options.showNoStats When true, players are returned with zeroed stats objects even if they have accumulated no stats for a team (such as  players who were just traded for, free agents, etc.); this applies only for regular season stats. To show draft prospects, options.showRookies is needed. Default is false, but if options.stats is empty, this is always true.
 * @param {boolean=} options.showRookies If true (default false), then future draft prospects and rookies drafted in the current season (g.get("season")) are shown if that season is requested. This is mainly so, after the draft, rookies can show up in the roster, player ratings view, etc; and also so prospects can be shown in the watch list. After the next season starts, then they will no longer show up in a request for that season since they didn't actually play that season.
 * @param {boolean=} options.showRetired If true (default false), then players with no ratings for the current season are still returned, with either 0 for every rating and a blank array for skills (retired players) or future ratings (draft prospects). This is currently only used for the watch list, so retired players (and future draft prospects!) can still be watched.
 * @param {boolean=} options.fuzz When true (default false), noise is added to any returned ratings based on the fuzz variable for the given season (default: false); any user-facing rating should use true, any non-user-facing rating should use false.
 * @param {boolean=} options.oldStats When true (default false), stats from the previous season are displayed if there are no stats for the current season. This is currently only used for the free agents list, so it will either display stats from this season if they exist, or last season if they don't.
 * @param {number=} options.numGamesRemaining If the "cashOwed" attr is requested, options.numGamesRemaining is used to calculate how much of the current season's contract remains to be paid. This is used for buying out players.
 * @param {string=} options.statType What type of stats to return, 'perGame', 'per36', or 'totals' (default is 'perGame).
 * @return {Object|Array.<Object>} Filtered player object or array of filtered player objects, depending on the first argument.
 */
const getCopies = async (
	players: Player[],
	{
		season,
		tid,
		attrs = [],
		ratings = [],
		stats = [],
		playoffs = false,
		regularSeason = true,
		showNoStats = false,
		showRookies = false,
		showRetired = false,
		fuzz = false,
		oldStats = false,
		numGamesRemaining = 0,
		statType = "perGame",
		mergeStats = false,
	}: PlayersPlusOptions,
): Promise<PlayerFiltered[]> => {
	const options: PlayersPlusOptionsRequired = {
		season,
		tid,
		attrs,
		ratings,
		stats,
		playoffs,
		regularSeason,
		showNoStats,
		showRookies,
		showRetired,
		fuzz,
		oldStats,
		numGamesRemaining,
		statType,
		mergeStats,
	};

	return players
		.map(p => processPlayer(p, options))
		.filter(p => p !== undefined);
};

export default getCopies;
