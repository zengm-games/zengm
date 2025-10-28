import { PLAYER, PHASE, bySport, isSport } from "../../../common/index.ts";
import { player, trade } from "../../core/index.ts";
import {
	g,
	helpers,
	processPlayerStats as processPlayerStats2,
} from "../../util/index.ts";
import type {
	Player,
	PlayerFiltered,
	PlayerStatType,
	PlayersPlusOptions,
} from "../../../common/types.ts";
import type { StatSumsExtra } from "../../../common/processPlayerStats.basketball.ts";
import { idb } from "../index.ts";

type PlayersPlusOptionsRequired = Required<
	Omit<
		PlayersPlusOptions,
		"disableAbbrevsCacheDatabaseAccess" | "season" | "seasonRange" | "tid"
	>
> & {
	season?: number;
	seasonRange?: [number, number];
	tid?: number;
};

const getLatestTransaction = (
	transactions: Player["transactions"],
	season: number | undefined,
	tid: number | undefined,
) => {
	if (transactions && transactions.length > 0) {
		if (season === undefined || season >= g.get("season")) {
			return transactions.at(-1);
		} else {
			// Iterate over transactions backwards, find most recent one that was before the supplied season
			for (let i = transactions.length - 1; i >= 0; i--) {
				const currentTransaction = transactions[i]!;
				if (tid !== undefined && currentTransaction.tid !== tid) {
					continue;
				}

				if (
					currentTransaction.season < season ||
					(currentTransaction.season === season &&
						currentTransaction.phase <= PHASE.PLAYOFFS)
				) {
					return transactions[i];
				}
			}
		}
	}
};

class AbbrevsCache {
	// First key is season, second is tid, value is undefined (not loaded, either because tid/season not found or because load not yet called) or string (loaded abbrev)
	private data = new Map<number, Map<number, string | undefined>>();
	private state: "init" | "loading" | "loaded" = "init";
	private minSafeSeason: number;

	// Set disableDatabaseAccess to true if you're calling this during another IndexedDB transaction that you don't want to auto close. Then it will only look up abbrevs that are safe to access in the cache
	constructor(disableDatabaseAccess: boolean) {
		this.minSafeSeason = disableDatabaseAccess
			? g.get("season") - 2
			: -Infinity;
	}

	add(season: number, tid: number) {
		if (this.state !== "init") {
			throw new Error("Cannot call add after load");
		}

		let abbrevsByTid = this.data.get(season);
		if (!abbrevsByTid) {
			abbrevsByTid = new Map();
			this.data.set(season, abbrevsByTid);
		}

		abbrevsByTid.set(tid, undefined);
	}

	private saveAbbrev(
		abbrevsByTid: Map<number, string | undefined>,
		tid: number,
		abbrev: string | undefined,
	) {
		abbrevsByTid.set(
			tid,
			abbrev ?? g.get("teamInfoCache")[tid]?.abbrev ?? "???",
		);
	}

	async load() {
		if (this.state !== "init") {
			throw new Error("Cannot call load multiple times");
		}
		this.state = "loading";

		for (const [seasonTemp, abbrevsByTid] of this.data) {
			// When should we fetch all for season vs not? I'm not sure what the ideal value is, I just guessed
			const bulkFetch = abbrevsByTid.size >= 6;

			const season =
				seasonTemp >= this.minSafeSeason ? seasonTemp : this.minSafeSeason;

			if (bulkFetch) {
				const rows = await idb.getCopies.teamSeasons({ season }, "noCopyCache");
				for (const row of rows) {
					this.saveAbbrev(abbrevsByTid, row.tid, row.abbrev);
				}
			}

			// This handles when abbrevsByTid.size < 3, or when teamSeason is missing for one of the requested tids
			for (const [tid, existingAbbrev] of abbrevsByTid) {
				if (bulkFetch && existingAbbrev === undefined) {
					// If teamSeason existed, it would have been found above
					this.saveAbbrev(abbrevsByTid, tid, undefined);
				} else {
					const row = await idb.getCopy.teamSeasons(
						{ season, tid },
						"noCopyCache",
					);
					this.saveAbbrev(abbrevsByTid, tid, row?.abbrev);
				}
			}
		}

		this.state = "loaded";
	}

	get(season: number, tid: number) {
		if (this.state !== "loaded") {
			throw new Error("Cannot call get before load completes");
		}

		if (tid < 0) {
			return helpers.getAbbrev(tid);
		}

		const abbrev = this.data.get(season)?.get(tid);
		if (abbrev === undefined) {
			console.log(this.data);
			throw new Error("Invalid season/tid");
		}
		return abbrev;
	}
}

const processAttrs = (
	output: PlayerFiltered,
	p: Player,
	{
		attrs,
		fuzz,
		numGamesRemaining,
		season,
		seasonRange,
		tid,
	}: PlayersPlusOptionsRequired,
	abbrevsCache: AbbrevsCache | undefined,
) => {
	const getSalary = () => {
		let total = 0;

		for (const salary of p.salaries) {
			if (seasonRange !== undefined) {
				if (
					salary.season >= seasonRange[0] &&
					salary.season <= seasonRange[1]
				) {
					total += salary.amount / 1000;
				}
			} else {
				if (salary.season === season || season === undefined) {
					total += salary.amount / 1000;
				}
			}
		}

		return total;
	};

	for (const attr of attrs) {
		if (attr === "age") {
			const s = season ?? seasonRange?.[1] ?? g.get("season");
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
			output.draft.abbrev =
				abbrevsCache?.get(output.draft.year, output.draft.tid) ?? "???";
			output.draft.originalAbbrev =
				abbrevsCache?.get(output.draft.year, output.draft.originalTid) ?? "???";
		} else if (attr === "draftPosition") {
			// Estimate pick number from draft round and pick. Would be better to store the real value
			if (p.draft.round > 0 && p.draft.pick > 0) {
				output.draftPosition =
					p.draft.pick + (p.draft.round - 1) * g.get("numActiveTeams");
			} else {
				// Undrafted
				output.draftPosition = Math.round(
					(0.5 + g.get("numDraftRounds")) * g.get("numActiveTeams"),
				);
			}
		} else if (attr === "contract") {
			if (
				seasonRange === undefined &&
				(g.get("season") === season || season === undefined)
			) {
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
		} else if (attr === "hof") {
			output[attr] = !!p[attr];
		} else if (attr === "watch") {
			output[attr] = p[attr] ?? 0;
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
			output.salaries = helpers.deepCopy(p.salaries).map((salary) => {
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
		} else if (attr === "untradable") {
			Object.assign(output, trade.isUntradable(p));
		} else if (attr === "numBrothers") {
			output.numBrothers = p.relatives.filter(
				(rel) => rel.type === "brother",
			).length;
		} else if (attr === "numFathers") {
			output.numFathers = p.relatives.filter(
				(rel) => rel.type === "father",
			).length;
		} else if (attr === "numSons") {
			output.numSons = p.relatives.filter((rel) => rel.type === "son").length;
		} else if (attr === "numAllStar") {
			output.numAllStar = p.awards.filter(
				(a) =>
					a.type === "All-Star" &&
					(season === undefined || a.season <= season) &&
					(seasonRange === undefined ||
						(a.season >= seasonRange[0] && a.season <= seasonRange[1])),
			).length;
		} else if (attr === "latestTransaction") {
			const transaction = getLatestTransaction(p.transactions, season, tid);

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
						transaction.pickNum,
					)} pick in the ${draftName}`;
				} else if (transaction.type === "freeAgent") {
					output.latestTransaction = `Free agent signing in ${transaction.season}`;
				} else if (transaction.type === "trade") {
					const abbrev =
						abbrevsCache?.get(transaction.season, transaction.fromTid) ?? "???";
					const url =
						transaction.eid !== undefined
							? helpers.leagueUrl(["trade_summary", transaction.eid])
							: helpers.leagueUrl(["roster", abbrev, transaction.season]);
					output.latestTransaction = `Trade with <a href="${url}">${abbrev} in ${transaction.season}</a>`;
				} else if (transaction.type === "godMode") {
					output.latestTransaction = `God Mode in ${transaction.season}`;
				} else if (transaction.type === "import") {
					output.latestTransaction = `Imported in ${transaction.season}`;
				} else if (transaction.type === "sisyphus") {
					const abbrev =
						abbrevsCache?.get(transaction.season, transaction.fromTid) ?? "???";
					const url = helpers.leagueUrl(["roster", abbrev, transaction.season]);
					output.latestTransaction = `Sisyphus Mode with <a href="${url}">${abbrev} in ${transaction.season}</a>`;
				}
			} else {
				output.latestTransaction = "";
			}
		} else if (attr === "latestTransactionSeason") {
			if (p.transactions && p.transactions.length > 0) {
				output.latestTransactionSeason = p.transactions.at(-1)!.season;
			} else {
				output.latestTransactionSeason = undefined;
			}
		} else if (attr === "jerseyNumber") {
			output.jerseyNumber = helpers.getJerseyNumber(
				p,
				p.tid === PLAYER.RETIRED ? "mostCommon" : "current",
			);
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
			// @ts-expect-error
			output[attr] = helpers.deepCopy(p[attr]);
		}
	}
};

const processRatings = (
	output: PlayerFiltered,
	p: Player,
	playerRatingsInput: any[],
	{
		fuzz,
		ratings,
		showDraftProspectRookieRatings,
		showRetired,
		stats,
		season,
		tid,
	}: PlayersPlusOptionsRequired,
	abbrevsCache: AbbrevsCache | undefined,
) => {
	let playerRatings = playerRatingsInput;

	if (
		showDraftProspectRookieRatings &&
		p.tid === PLAYER.UNDRAFTED &&
		season !== undefined
	) {
		season = p.draft.year;
	}

	// If we're returning all seasons for a specific team, filter ratings to match stats
	if (season === undefined && tid !== undefined) {
		const statsSeasons = p.stats
			.filter((ps) => ps.tid === tid)
			.map((ps) => ps.season);
		playerRatings = playerRatings.filter((pr) =>
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
				...p.ratings.at(-1),
			},
		];
	}

	output.ratings = playerRatings.map((pr) => {
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
						'If you request "abbrev" or "tid" from ratings, you must also request "tid", "season", and "playoffs" from stats',
					);
				}

				let tidTemp;

				for (const ps of Array.isArray(output.stats)
					? output.stats
					: [output.stats]) {
					if (
						ps.season === pr.season &&
						ps.playoffs === false &&
						ps.tid !== PLAYER.TOT
					) {
						tidTemp = ps.tid;
					}
				}

				let tidTemp2;
				if (
					pr.season === g.get("season") &&
					tidTemp === undefined &&
					p.tid >= 0
				) {
					tidTemp2 = p.tid;
				}

				if (attr === "abbrev") {
					if (tidTemp !== undefined) {
						row.abbrev = abbrevsCache?.get(pr.season, tidTemp) ?? "???";
					} else if (tidTemp2 !== undefined) {
						row.abbrev = helpers.getAbbrev(tidTemp2);
					} else {
						row.abbrev = "";
					}
				} else {
					row.tid = tidTemp;
				}
			} else if (attr === "ovrs" || attr === "pots") {
				row[attr] = player.fuzzOvrs(pr[attr], pr.fuzz);
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
		output.ratings = output.ratings.at(-1);

		if (output.ratings === undefined && showRetired) {
			const row: any = {};

			for (const attr of ratings) {
				if (attr === "skills") {
					row.skills = [];
				} else if (attr === "age") {
					row.age = season - p.born.year;
				} else if (attr === "pos") {
					row.pos = p.ratings.at(-1).pos;
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

export const weightByMinutes = new Set(
	bySport({
		baseball: [],
		basketball: [
			"per",
			"ws48",
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
			"pm100",
			"onOff100",
		],
		football: [],
		hockey: [],
	}),
);

const filterForCareerStats = (
	allStats: any[],
	seasonType: "playoffs" | "regularSeason" | "combined",
	mergeStats: PlayersPlusOptionsRequired["mergeStats"],
) => {
	return allStats.filter(
		(row) =>
			((row.playoffs === "combined" && seasonType === "combined") ||
				(row.playoffs === true && seasonType === "playoffs") ||
				(row.playoffs === false && seasonType === "regularSeason")) &&
			// Combined only has TOT, even for totAndTeams, so keep TOT combined rows
			(mergeStats !== "totAndTeams" ||
				row.playoffs === "combined" ||
				row.tid !== PLAYER.TOT),
	);
};

const sumCareerStats = (careerStats: any[], attr: string) => {
	let info:
		| {
				type: "max";
				value: null | [number, number, string, number, number];
		  }
		| {
				type: "byPos";
				value: (number | undefined)[];
		  }
		| {
				type: "normal";
				value: number;
		  }
		| {
				type: "tovpHack";
				value: [0, 0]; // Numberator and denominator of tovp formula
		  };

	if (isSport("basketball") && attr === "tovp") {
		info = {
			type: "tovpHack",
			value: [0, 0],
		};
	} else if (attr.endsWith("Max")) {
		info = {
			type: "max",
			value: null,
		};
	} else if (
		player.stats.byPos?.includes(attr) ||
		(isSport("baseball") && attr === "rfld")
	) {
		info = {
			type: "byPos",
			value: [],
		};
	} else {
		info = {
			type: "normal",
			value: 0,
		};
	}

	const weightAttrByMinutes = weightByMinutes.has(attr);
	const lng = attr.endsWith("Lng");

	// Calculate values used for perGame and per36 averages, which is needed for historical stats where some seasons might not have had a stat collected. Like if you want career assists per game, and only 2 of the player's 5 seasons were after they started tracking assists, we need to know gp for only those 2 seasons
	let extraForMissingValues:
		| {
				gp: number | undefined;
				min: number | undefined;
		  }
		| undefined;

	for (const cs of careerStats) {
		if (isSport("basketball") && info.type === "tovpHack") {
			if (cs.tov !== undefined) {
				info.value[0] += cs.tov;
				info.value[1] += cs.fga + 0.44 * cs.fta + cs.tov;
			}

			continue;
		}

		if (cs[attr] === undefined) {
			if (isSport("basketball") && !extraForMissingValues) {
				extraForMissingValues = {
					gp: 0,
					min: 0,
				};
			}
			continue;
		}

		// Special case for trb - even if first season has trb, we still want to keep tracking extraForMissingValues because we'll need it later when adding up with drb/orb seasons
		if (isSport("basketball") && !extraForMissingValues && attr === "trb") {
			extraForMissingValues = {
				gp: 0,
				min: 0,
			};
		}

		if (info.type === "byPos") {
			for (let i = 0; i < cs[attr].length; i++) {
				const arrayValue = cs[attr][i];
				if (arrayValue !== undefined) {
					if (info.value[i] === undefined) {
						info.value[i] = 0;
					}
					info.value[i] += arrayValue;
				}
			}
		} else {
			const num = weightAttrByMinutes ? cs[attr] * cs.min : cs[attr];

			if (info.type === "max") {
				if (num === undefined || num === null) {
					continue;
				}

				info.value =
					info.value === null || num[0] > info.value[0]
						? [num[0], num[1], helpers.getAbbrev(cs.tid), cs.tid, cs.season]
						: info.value;
			} else if (lng) {
				info.value = num > info.value ? num : info.value;
			} else {
				info.value += num;

				if (extraForMissingValues) {
					for (const key of ["gp", "min"] as const) {
						if (typeof cs[key] === "number") {
							if (extraForMissingValues[key] !== undefined) {
								extraForMissingValues[key] += cs[key];
							}
						} else {
							// Missing this value for some row, meaning we just can't compute per game or per 36 minutes or whatever for this stat
							extraForMissingValues[key] = undefined;
						}
					}
				}
			}
		}
	}

	let outputValue;
	if (isSport("basketball") && info.type === "tovpHack") {
		// Finalize tovp formula
		outputValue = helpers.percentage(info.value[0], info.value[1]) ?? 0;
	} else {
		outputValue = info.value;
	}

	return {
		value: outputValue,
		extraForMissingValues,
	};
};

const getPlayerStats = (
	playerStats: any[],
	season: number | undefined,
	tid: number | undefined,
	playoffs: boolean,
	regularSeason: boolean,
	combined: boolean,
	mergeStats: PlayersPlusOptionsRequired["mergeStats"],
) => {
	const rows = helpers.deepCopy(
		playerStats.filter((ps) => {
			// Not sure why this is needed, but might fix an error someone reported
			if (!ps) {
				return false;
			}

			const seasonCheck = season === undefined || ps.season === season;
			const tidCheck = tid === undefined || ps.tid === tid;
			const playoffsCheck =
				(playoffs && ps.playoffs) ||
				(regularSeason && !ps.playoffs) ||
				combined;
			return seasonCheck && tidCheck && playoffsCheck;
		}),
	);

	// Can't merge if there's only 1 row!
	if ((mergeStats === "none" || rows.length <= 1) && !combined) {
		return rows;
	}

	let thereAreRowsToMerge = false;
	const seasonInfoKey = (row: { season: number; playoffs: true }) =>
		JSON.stringify([row.season, row.playoffs]);
	const seasonInfoCombinedKey = (row: { season: number }) => String(row.season);
	type SeasonInfo = {
		season: number;
		seasonType: "regularSeason" | "playoffs" | "combined";
		rows: any[];
	};
	const seasonInfos: SeasonInfo[] = [];
	const seasonInfosByKey: Record<string, SeasonInfo> = {};
	for (const row of rows) {
		if (row.gp === 0) {
			// Ignore rows with 0 GP, hope that's safe!
			continue;
		}

		if (regularSeason || playoffs) {
			const key = seasonInfoKey(row);
			if (seasonInfosByKey[key]) {
				seasonInfosByKey[key].rows.push(row);
				thereAreRowsToMerge = true;
			} else {
				const seasonInfo: SeasonInfo = {
					season: row.season,
					seasonType: row.playoffs ? "playoffs" : "regularSeason",
					rows: [row],
				};
				seasonInfos.push(seasonInfo);
				seasonInfosByKey[key] = seasonInfo;
			}
		}

		if (combined) {
			// Need to always activate this, so we go through the code path that returns from seasonInfo (with playoffs="combined") rather than raw rows
			thereAreRowsToMerge = true;

			const combinedRow = {
				...row,
				playoffs: "combined",
			};

			const keyCombined = seasonInfoCombinedKey(combinedRow);
			if (seasonInfosByKey[keyCombined]) {
				seasonInfosByKey[keyCombined].rows.push(combinedRow);
			} else {
				const seasonInfo: SeasonInfo = {
					season: combinedRow.season,
					seasonType: "combined",
					rows: [combinedRow],
				};
				seasonInfos.push(seasonInfo);
				seasonInfosByKey[keyCombined] = seasonInfo;
			}
		}
	}

	// Merged playoffs can only happen with God Mode forcing a player to switch teams during playoffs
	const getMerged = (
		rowsToMerge: any[],
		seasonType: "regularSeason" | "playoffs" | "combined",
	) => {
		// Aggregate annual stats and ignore other things
		const ignoredKeys = new Set([
			"season",
			"tid",
			"yearsWithTeam",
			"playoffs",
			"jerseyNumber",
		]);
		const statSums: any = {};

		const rowsToMerge2 = filterForCareerStats(
			rowsToMerge,
			seasonType,
			mergeStats,
		);

		for (const attr of getAttrsToSum(rowsToMerge)) {
			if (!ignoredKeys.has(attr)) {
				statSums[attr] = sumCareerStats(rowsToMerge2, attr).value;
			}
		}

		// Special case for some variables, weight by minutes
		for (const attr of weightByMinutes) {
			if (Object.hasOwn(statSums, attr)) {
				if (statSums.min > 0) {
					statSums[attr] /= statSums.min;
				} else {
					statSums[attr] = 0;
				}
			}
		}

		// Defaults from latest entry
		for (const attr of ignoredKeys) {
			if (attr === "tid" && mergeStats === "totAndTeams") {
				// In combined mode, if all teams are the same (like same regular season and playoffs team), then keep the tid there
				if (seasonType === "combined") {
					let allSame = true;
					const firstTid = rowsToMerge[0].tid;
					for (const row of rowsToMerge) {
						if (row.tid !== firstTid) {
							allSame = false;
							break;
						}
					}
					if (allSame) {
						statSums[attr] = firstTid;
					} else {
						statSums[attr] = PLAYER.TOT;
					}
				} else {
					statSums[attr] = PLAYER.TOT;
				}
			} else {
				statSums[attr] = rowsToMerge.at(-1)[attr];
			}
		}

		// totAndTeams doesn't make sense for "combined" because the goal is to see the combined output
		if (mergeStats === "totAndTeams" && seasonType !== "combined") {
			// Return individual stats rows and the merged row
			return [
				...rowsToMerge.map((row) => ({
					...row,
					hasTot: true,
				})),
				statSums,
			];
		}

		// Just return the merged row, discard the individual team entries
		return statSums;
	};

	if (thereAreRowsToMerge) {
		return seasonInfos.flatMap((seasonInfo) =>
			seasonInfo.rows.length > 1
				? getMerged(seasonInfo.rows, seasonInfo.seasonType)
				: seasonInfo.rows,
		);
	}

	return rows;
};

const processPlayerStats = (
	p: any,
	statSums: any,
	stats: string[],
	statType: PlayerStatType,
	keepWithNoStats: boolean,
	season: number | "career" | undefined, // undefined means showNoStats was used with career totals, but this is an individual stat season so idk
	abbrevsCache: AbbrevsCache | undefined,
	statSumsExtra?: StatSumsExtra,
) => {
	const output = processPlayerStats2(
		statSums,
		stats,
		statType,
		p.born.year,
		keepWithNoStats,
		statSumsExtra,
	);

	// More common stuff between basketball/football could be moved here... abbrev is just special cause it needs to run on the worker
	if (stats.includes("abbrev")) {
		if (statSums.tid === undefined) {
			if (season === g.get("season")) {
				output.abbrev = helpers.getAbbrev(
					p.tid === PLAYER.UNDRAFTED ? PLAYER.UNDRAFTED : PLAYER.FREE_AGENT,
				);
			} else if (typeof season === "number") {
				output.abbrev = season <= p.draft.year ? "DP" : "FA";
			} else {
				output.abbrev = "???";
			}
		} else if (typeof season === "number") {
			output.abbrev = abbrevsCache?.get(season, statSums.tid) ?? "???";
		} else {
			output.abbrev = helpers.getAbbrev(statSums.tid);
		}
	}
	if (stats.includes("tid")) {
		if (statSums.tid === undefined) {
			if (season === g.get("season")) {
				output.tid = p.tid;
			} else if (typeof season === "number") {
				output.tid =
					season <= p.draft.year ? PLAYER.UNDRAFTED : PLAYER.FREE_AGENT;
			} else {
				output.tid = PLAYER.FREE_AGENT;
			}
		} else {
			output.tid = statSums.tid;
		}
	}

	return output;
};

const getAttrsToSum = (statsRows: any[]) => {
	const attrs = statsRows.length > 0 ? Object.keys(statsRows.at(-1)) : [];

	// If these are historical stats with TRB rather than ORB and DRB separate, that will be apparent in the first (oldest) row
	if (
		isSport("basketball") &&
		statsRows.length > 0 &&
		statsRows[0].trb !== undefined
	) {
		attrs.push("trb");
	}

	// If these are historical stats with TOV missing in the first row, then it's possible we need a special calculation of TOV% because we need to use FGA and FTA only from rows with TOV
	if (
		isSport("basketball") &&
		statsRows.length > 0 &&
		statsRows[0].tov === undefined &&
		statsRows.some((row) => row.tov !== undefined)
	) {
		attrs.push("tovp");
	}

	return attrs;
};

const processStats = (
	output: PlayerFiltered,
	p: Player,
	playerStatsInput: any[],
	{
		mergeStats,
		playoffs,
		regularSeason,
		combined,
		season,
		tid,
		showNoStats,
		oldStats,
		statType,
		stats,
	}: PlayersPlusOptionsRequired,
	keepWithNoStats: boolean,
	abbrevsCache: AbbrevsCache | undefined,
) => {
	// Only season(s) and team in question
	let playerStats = getPlayerStats(
		playerStatsInput,
		season,
		tid,
		playoffs,
		regularSeason,
		combined,
		mergeStats,
	);

	// oldStats crap
	if (
		oldStats &&
		season !== undefined &&
		(playerStats.length === 0 ||
			(season === g.get("season") && g.get("phase") === PHASE.PRESEASON))
	) {
		const oldSeason = season - 1;
		const playerStats2 = getPlayerStats(
			playerStatsInput,
			oldSeason,
			tid,
			playoffs,
			regularSeason,
			combined,
			mergeStats,
		);
		if (playerStats2.length > 0) {
			playerStats = playerStats2;
		}
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
	output.stats = playerStats.map((ps) => {
		if (season === undefined) {
			careerStats.push(ps);
		}

		return processPlayerStats(
			p,
			ps,
			stats,
			statType,
			keepWithNoStats,
			ps.season ?? season,
			abbrevsCache,
		);
	});

	if (
		season !== undefined &&
		((playoffs && !regularSeason && !combined) ||
			(!playoffs && regularSeason && !combined) ||
			(!playoffs && !regularSeason && combined))
	) {
		// Take last value, in case player was traded/signed to team twice in a season
		output.stats = output.stats.at(-1);
	} else if (season === undefined) {
		// Aggregate annual stats and ignore other things
		const ignoredKeys = new Set([
			"season",
			"tid",
			"yearsWithTeam",
			"jerseyNumber",
		]);

		const statSums = {
			regularSeason: {} as any,
			playoffs: {} as any,
			combined: {} as any,
		};

		const statSumsExtra = {
			regularSeason: {} as StatSumsExtra,
			playoffs: {} as StatSumsExtra,
			combined: {} as StatSumsExtra,
		};

		const careerStatsFiltered = {
			regularSeason: regularSeason
				? filterForCareerStats(careerStats, "regularSeason", mergeStats)
				: [],
			playoffs: playoffs
				? filterForCareerStats(careerStats, "playoffs", mergeStats)
				: [],
			combined: combined
				? filterForCareerStats(careerStats, "combined", mergeStats)
				: [],
		};

		const seasonTypes: ("regularSeason" | "playoffs" | "combined")[] = [];
		if (regularSeason) {
			seasonTypes.push("regularSeason");
		}
		if (playoffs) {
			seasonTypes.push("playoffs");
		}
		if (combined) {
			seasonTypes.push("combined");
		}

		for (const seasonType of seasonTypes) {
			for (const attr of getAttrsToSum(careerStatsFiltered[seasonType])) {
				if (!ignoredKeys.has(attr)) {
					const sumInfo = sumCareerStats(careerStatsFiltered[seasonType], attr);

					statSums[seasonType][attr] = sumInfo.value;

					if (sumInfo.extraForMissingValues) {
						statSumsExtra[seasonType][attr] = sumInfo.extraForMissingValues;
					}
				}
			}
		}

		// Special case for some variables, weight by minutes
		for (const attr of weightByMinutes) {
			for (const seasonType of seasonTypes) {
				const object = statSums[seasonType];
				if (Object.hasOwn(object, attr)) {
					if (statSumsExtra[seasonType][attr]) {
						const min = statSumsExtra[seasonType][attr].min;
						if (min === undefined) {
							object[attr] = 0;
						} else {
							object[attr] /= min;
						}
					} else if (object.min > 0) {
						object[attr] /= object.min;
					} else {
						object[attr] = 0;
					}
				}
			}
		}

		if (regularSeason) {
			output.careerStats = processPlayerStats(
				p,
				statSums.regularSeason,
				stats,
				statType,
				keepWithNoStats,
				"career",
				undefined,
				statSumsExtra.regularSeason,
			);
		}

		if (playoffs) {
			output.careerStatsPlayoffs = processPlayerStats(
				p,
				statSums.playoffs,
				stats,
				statType,
				keepWithNoStats,
				"career",
				undefined,
				statSumsExtra.playoffs,
			);
		}

		if (combined) {
			output.careerStatsCombined = processPlayerStats(
				p,
				statSums.combined,
				stats,
				statType,
				keepWithNoStats,
				"career",
				undefined,
				statSumsExtra.combined,
			);
		}
	}
};

const processPlayer = (
	p: Player,
	options: PlayersPlusOptionsRequired,
	abbrevsCache: AbbrevsCache | undefined,
) => {
	const {
		attrs,
		ratings,
		season,
		seasonRange,
		showNoStats,
		showRetired,
		showRookies,
	} = options;

	const playerRatings =
		seasonRange === undefined
			? p.ratings
			: p.ratings.filter(
					(r) => r.season >= seasonRange[0] && r.season <= seasonRange[1],
				);
	if (playerRatings.length === 0) {
		return;
	}
	const playerStats =
		seasonRange === undefined
			? p.stats
			: p.stats.filter(
					(r) => r.season >= seasonRange[0] && r.season <= seasonRange[1],
				);

	const output: any = {};

	if (ratings.length > 0 && season !== undefined) {
		const hasRatingsSeason = playerRatings.some(
			(r) =>
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
		processStats(
			output,
			p,
			playerStats,
			options,
			keepWithNoStats,
			abbrevsCache,
		);

		// Only add a player if filterStats finds something (either stats that season, or options overriding that check)
		if (output.stats === undefined && !keepWithNoStats) {
			return;
		}
	}

	// processRatings must be after processStats for abbrev hack
	if (ratings.length > 0) {
		processRatings(output, p, playerRatings, options, abbrevsCache);

		// This should be mostly redundant with hasRatingsSeason above
		// output.ratings.length check is for seasonRange where all seasons are filtered out
		if (output.ratings === undefined || output.ratings.length === 0) {
			return;
		}
	}

	if (attrs.length > 0) {
		processAttrs(output, p, options, abbrevsCache);
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
		seasonRange,
		tid,
		attrs = [],
		ratings = [],
		stats = [],
		playoffs = false,
		regularSeason = true,
		combined = false,
		showNoStats = false,
		showRookies = false,
		showRetired = false,
		showDraftProspectRookieRatings = false,
		fuzz = false,
		oldStats = false,
		numGamesRemaining = 0,
		statType = "perGame",
		mergeStats = "none",
		disableAbbrevsCacheDatabaseAccess = false,
	}: PlayersPlusOptions,
): Promise<PlayerFiltered[]> => {
	if (mergeStats === "totAndTeams" && season !== undefined) {
		throw new Error(
			"mergeStats totAndTeams is not supported for individual seasons",
		);
	}

	const options: PlayersPlusOptionsRequired = {
		season,
		seasonRange,
		tid,
		attrs,
		ratings,
		stats,
		playoffs,
		regularSeason,
		combined,
		showNoStats,
		showRookies,
		showDraftProspectRookieRatings,
		showRetired,
		fuzz,
		oldStats,
		numGamesRemaining,
		statType,
		mergeStats,
	};

	// Preload any abbrevs we need for past seasons, so we don't need to make all functions async and do it on demand
	let abbrevsCache: AbbrevsCache | undefined;
	const hasDraft = attrs.includes("draft");
	const hasLatestTransaction = attrs.includes("latestTransaction");
	const hasRatings = ratings.includes("abbrev");
	const hasStats = stats.includes("abbrev");
	if (hasDraft || hasLatestTransaction || hasRatings || hasStats) {
		abbrevsCache = new AbbrevsCache(disableAbbrevsCacheDatabaseAccess);
		for (const p of players) {
			if (hasDraft) {
				for (const tid of [p.draft.tid, p.draft.originalTid]) {
					abbrevsCache.add(p.draft.year, tid);
				}
			}

			if (hasLatestTransaction) {
				const transaction = getLatestTransaction(p.transactions, season, tid);
				if (
					transaction &&
					(transaction.type === "trade" || transaction.type === "sisyphus")
				) {
					abbrevsCache.add(transaction.season, transaction.fromTid);
				}
			}

			// Ratings uses the tid from stats, so have ratings and stats both trigger a stats check
			if (hasRatings || hasStats) {
				for (const row of p.stats) {
					if (
						(season === undefined || season === row.season) &&
						(seasonRange === undefined ||
							(row.season >= seasonRange[0] && row.season <= seasonRange[1]))
					) {
						abbrevsCache.add(row.season, row.tid);
					}
				}
			}
		}

		await abbrevsCache.load();
	}

	return players
		.map((p) => processPlayer(p, options, abbrevsCache))
		.filter((p) => p !== undefined);
};

export default getCopies;
