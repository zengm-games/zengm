import { bySport, isSport, PHASE } from "../../common";
import { idb } from "../db";
import {
	defaultGameAttributes,
	g,
	helpers,
	processPlayersHallOfFame,
} from "../util";
import type {
	MinimalPlayerRatings,
	Player,
	PlayerInjury,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import { groupByUnique } from "../../common/groupBy";
import range from "lodash-es/range";

const getCategoriesAndStats = () => {
	const categories = bySport<
		{
			name: string;
			stat: string;
			statProp: string;
			title?: string;
			minStats: string[];
			minValue: number[];
			sortAscending?: true;
			filter?: (p: any) => boolean;
		}[]
	>({
		basketball: [
			{
				name: "Points",
				stat: "PTS",
				statProp: "pts",
				title: "Points Per Game",
				minStats: ["gp", "pts"],
				minValue: [70, 1400],
			},
			{
				name: "Rebounds",
				stat: "TRB",
				statProp: "trb",
				title: "Rebounds Per Game",
				minStats: ["gp", "trb"],
				minValue: [70, 800],
			},
			{
				name: "Assists",
				stat: "AST",
				statProp: "ast",
				title: "Assists Per Game",
				minStats: ["gp", "ast"],
				minValue: [70, 400],
			},
			{
				name: "Field Goals Made",
				stat: "FG",
				statProp: "fg",
				minStats: [],
				minValue: [],
			},
			{
				name: "Field Goals Attempted",
				stat: "FGA",
				statProp: "fga",
				minStats: [],
				minValue: [],
			},
			{
				name: "Field Goal Percentage",
				stat: "FG%",
				statProp: "fgp",
				minStats: ["fg"],
				minValue: [300 * g.get("twoPointAccuracyFactor")],
			},
			{
				name: "Three Pointers Made",
				stat: "3P",
				statProp: "tp",
				minStats: [],
				minValue: [],
			},
			{
				name: "Three Pointers Attempted",
				stat: "3PA",
				statProp: "tpa",
				minStats: [],
				minValue: [],
			},
			{
				name: "Three Point Percentage",
				stat: "3P%",
				statProp: "tpp",
				minStats: ["tp"],
				minValue: [Math.max(55 * g.get("threePointTendencyFactor"), 12)],
			},
			{
				name: "Free Throws Made",
				stat: "FT",
				statProp: "ft",
				minStats: [],
				minValue: [],
			},
			{
				name: "Free Throws Attempted",
				stat: "FTA",
				statProp: "fta",
				minStats: [],
				minValue: [],
			},
			{
				name: "Free Throw Percentage",
				stat: "FT%",
				statProp: "ftp",
				minStats: ["ft"],
				minValue: [125],
			},
			{
				name: "Blocks",
				stat: "BLK",
				statProp: "blk",
				minStats: ["gp", "blk"],
				minValue: [70, 100],
			},
			{
				name: "Steals",
				stat: "STL",
				statProp: "stl",
				minStats: ["gp", "stl"],
				minValue: [70, 125],
			},
			{
				name: "Minutes",
				stat: "MP",
				statProp: "min",
				minStats: ["gp", "min"],
				minValue: [70, 2000],
			},
			{
				name: "Player Efficiency Rating",
				stat: "PER",
				statProp: "per",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Estimated Wins Added",
				stat: "EWA",
				statProp: "ewa",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Win Shares / 48 Mins",
				stat: "WS/48",
				statProp: "ws48",
				title: "Win Shares Per 48 Minutes",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Offensive Win Shares",
				stat: "OWS",
				statProp: "ows",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Defensive Win Shares",
				stat: "DWS",
				statProp: "dws",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Win Shares",
				stat: "WS",
				statProp: "ws",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Offensive Box Plus-Minus",
				stat: "OBPM",
				statProp: "obpm",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Defensive Box Plus-Minus",
				stat: "DBPM",
				statProp: "dbpm",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Box Plus-Minus",
				stat: "BPM",
				statProp: "bpm",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				name: "Value Over Replacement Player",
				stat: "VORP",
				statProp: "vorp",
				minStats: ["min"],
				minValue: [2000],
			},
		],
		football: [
			{
				name: "Passing Yards",
				stat: "Yds",
				statProp: "pssYds",
				minStats: [],
				minValue: [],
			},
			{
				name: "Passing Yards Per Attempt",
				stat: "Y/A",
				statProp: "pssYdsPerAtt",
				minStats: ["pss"],
				minValue: [14 * 16],
			},
			{
				name: "Completion Percentage",
				stat: "%",
				statProp: "cmpPct",
				minStats: ["pss"],
				minValue: [14 * 16],
			},
			{
				name: "Passing TDs",
				stat: "TD",
				statProp: "pssTD",
				title: "Passing Touchdowns",
				minStats: [],
				minValue: [],
			},
			{
				name: "Passing Interceptions",
				stat: "Int",
				statProp: "pssInt",
				minStats: [],
				minValue: [],
			},
			{
				name: "Quarterback Rating",
				stat: "QBRat",
				statProp: "qbRat",
				minStats: ["pss"],
				minValue: [14 * 16],
			},
			{
				name: "Rushing Yards",
				stat: "Yds",
				statProp: "rusYds",
				minStats: [],
				minValue: [],
			},
			{
				name: "Rushing Yards Per Attempt",
				stat: "Y/A",
				statProp: "rusYdsPerAtt",
				minStats: ["rus"],
				minValue: [6.25 * 16],
			},
			{
				name: "Rushing TDs",
				stat: "TD",
				statProp: "rusTD",
				title: "Rushing Touchdowns",
				minStats: [],
				minValue: [],
			},
			{
				name: "Receiving Yards",
				stat: "Yds",
				statProp: "recYds",
				minStats: [],
				minValue: [],
			},
			{
				name: "Receiving Yards Per Attempt",
				stat: "Y/A",
				statProp: "recYdsPerAtt",
				minStats: ["rec"],
				minValue: [1.875 * 16],
			},
			{
				name: "Receiving TDs",
				stat: "TD",
				statProp: "recTD",
				title: "Receiving Touchdowns",
				minStats: [],
				minValue: [],
			},
			{
				name: "Yards From Scrimmage",
				stat: "Yds",
				statProp: "ydsFromScrimmage",
				title: "Total Rushing and Receiving Yards From Scrimmage",
				minStats: [],
				minValue: [],
			},
			{
				name: "Rushing and Receiving TDs",
				stat: "TD",
				statProp: "rusRecTD",
				title: "Total Rushing and Receiving Touchdowns",
				minStats: [],
				minValue: [],
			},
			{
				name: "Tackles",
				stat: "Tck",
				statProp: "defTck",
				minStats: [],
				minValue: [],
			},
			{
				name: "Sacks",
				stat: "Sk",
				statProp: "defSk",
				minStats: [],
				minValue: [],
			},
			{
				name: "Defensive Interceptions",
				stat: "Int",
				statProp: "defInt",
				minStats: [],
				minValue: [],
			},
			{
				name: "Forced Fumbles",
				stat: "FF",
				statProp: "defFmbFrc",
				minStats: [],
				minValue: [],
			},
			{
				name: "Fumbles Recovered",
				stat: "FR",
				statProp: "defFmbRec",
				minStats: [],
				minValue: [],
			},
			{
				name: "Approximate Value",
				stat: "AV",
				statProp: "av",
				minStats: [],
				minValue: [],
			},
		],
		hockey: [
			{
				name: "Goals",
				stat: "G",
				statProp: "g",
				minStats: [],
				minValue: [],
			},
			{
				name: "Assists",
				stat: "A",
				statProp: "a",
				minStats: [],
				minValue: [],
			},
			{
				name: "Points",
				stat: "PTS",
				statProp: "pts",
				minStats: [],
				minValue: [],
			},
			{
				name: "Plus/Minus",
				stat: "+/-",
				statProp: "pm",
				minStats: [],
				minValue: [],
				filter: p => p.ratings.pos !== "G",
			},
			{
				name: "Penalty Minutes",
				stat: "PIM",
				statProp: "pim",
				minStats: [],
				minValue: [],
			},
			{
				name: "Time On Ice",
				stat: "TOI",
				statProp: "min",
				minStats: [],
				minValue: [],
				filter: p => p.ratings.pos !== "G",
			},
			{
				name: "Blocks",
				stat: "BLK",
				statProp: "blk",
				minStats: [],
				minValue: [],
			},
			{
				name: "Hits",
				stat: "HIT",
				statProp: "hit",
				minStats: [],
				minValue: [],
			},
			{
				name: "Takeaways",
				stat: "TK",
				statProp: "tk",
				minStats: [],
				minValue: [],
			},
			{
				name: "Giveaways",
				stat: "GV",
				statProp: "gv",
				minStats: [],
				minValue: [],
			},
			{
				name: "Save Percentage",
				stat: "SV%",
				statProp: "svPct",
				minStats: ["sv"],
				minValue: [800],
			},
			{
				name: "Goals Against Average",
				stat: "GAA",
				statProp: "gaa",
				minStats: ["sv"],
				minValue: [800],
				sortAscending: true,
			},
			{
				name: "Shutouts",
				stat: "SO",
				statProp: "so",
				minStats: [],
				minValue: [],
			},
			{
				name: "Goals Created",
				stat: "GC",
				statProp: "gc",
				minStats: [],
				minValue: [],
			},
			{
				name: "Offensive Point Shares",
				stat: "OPS",
				statProp: "ops",
				minStats: [],
				minValue: [],
			},
			{
				name: "Defensive Point Shares",
				stat: "DPS",
				statProp: "dps",
				minStats: [],
				minValue: [],
			},
			{
				name: "Goalie Point Shares",
				stat: "GPS",
				statProp: "gps",
				minStats: [],
				minValue: [],
			},
			{
				name: "Point Shares",
				stat: "PS",
				statProp: "ps",
				minStats: [],
				minValue: [],
			},
		],
	});

	const statsSet = new Set<string>();
	for (const { minStats, statProp } of categories) {
		statsSet.add(statProp);

		for (const stat of minStats) {
			statsSet.add(stat);
		}
	}

	const stats = Array.from(statsSet);
	return {
		categories,
		stats,
	};
};

// Calculate the number of games played for each team, which is used to test if a player qualifies as a league leader
class GamesPlayedCache {
	currentSeasonCache: Record<number, number> | undefined;
	playoffsCache: Record<number, Record<number, number>>;

	constructor() {
		this.playoffsCache = {};
	}

	private straightNumGames(season: number, playoffs: boolean) {
		// Regular season, completed season -> we already know how many games each team played, from numGames
		return (
			!playoffs &&
			(season < g.get("season") || g.get("phase") > PHASE.REGULAR_SEASON)
		);
	}

	async loadSeason(season: number | "career", playoffs: boolean) {
		if (season === "career" || this.straightNumGames(season, playoffs)) {
			return;
		}

		const teamSeasons = await idb.getCopies.teamSeasons(
			{
				season,
			},
			"noCopyCache",
		);

		const numGames = g.get("numGames", season);

		const cache: Record<number, number> = {};
		for (const teamSeason of teamSeasons) {
			if (playoffs) {
				if (teamSeason.gp < numGames) {
					cache[teamSeason.tid] = 0;
				} else {
					cache[teamSeason.tid] = teamSeason.gp - numGames;
				}
			} else {
				// Don't count playoff games
				if (teamSeason.gp > numGames) {
					cache[teamSeason.tid] = numGames;
				} else {
					cache[teamSeason.tid] = teamSeason.gp;
				}
			}
		}

		if (playoffs) {
			this.playoffsCache[season] = cache;
		} else {
			this.currentSeasonCache = cache;
		}
	}

	get(season: number | "career", playoffs: boolean, tid: number) {
		if (season === "career") {
			if (playoffs) {
				// Arbitrary - two full playoffs runs
				const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries");
				let sum = 0;
				for (const games of numGamesPlayoffSeries) {
					sum += games;
				}
				return 2 * sum;
			}

			// Arbitrary - 5 seasons
			return g.get("numGames") * 5;
		}

		if (this.straightNumGames(season, playoffs)) {
			return g.get("numGames", season);
		}

		if (playoffs) {
			return this.playoffsCache[season][tid] ?? 0;
		}

		return this.currentSeasonCache?.[tid] ?? 0;
	}
}

const iterateAllPlayers = async (
	season: number | "all" | "career",
	cb: (
		p: Player<MinimalPlayerRatings>,
		season: number | "career",
	) => Promise<void>,
) => {
	// Even in past seasons, make sure we have latest info for players
	const cachePlayers = await idb.cache.players.getAll();
	const cachePlayersByPid = groupByUnique(cachePlayers, "pid");

	const applyCB = async (p: Player<MinimalPlayerRatings>) => {
		if (season === "all") {
			const seasons = new Set(p.stats.map(row => row.season));
			for (const season of seasons) {
				await cb(p, season);
			}
		} else {
			await cb(p, season);
		}
	};

	// For current season, assume everyone is cached, although this might not be true for tragic deaths and God Mode edited players
	if (season === g.get("season") && g.get("phase") <= PHASE.PLAYOFFS) {
		for (const p of cachePlayers) {
			await applyCB(p);
		}
		return;
	}

	// This is similar to activeSeason from getCopies.players
	const transaction = idb.league.transaction("players");

	let range;
	const useRange = typeof season === "number";
	if (useRange) {
		// + 1 in upper range is because you don't accumulate stats until the year after the draft
		range = IDBKeyRange.bound([-Infinity, season], [season + 1, Infinity]);
	}

	let cursor = await transaction.store
		.index("draft.year, retiredYear")
		.openCursor(range);

	while (cursor) {
		// https://gist.github.com/inexorabletash/704e9688f99ac12dd336
		const [draftYear, retiredYear] = cursor.key;
		if (useRange && retiredYear < season) {
			cursor = await cursor.continue([draftYear, season]);
		} else {
			const p = cachePlayersByPid[cursor.value.pid] ?? cursor.value;
			await applyCB(p);
			cursor = await cursor.continue();
		}
	}
};

const NUM_LEADERS = 10;

const updateLeaders = async (
	inputs: ViewInput<"leaders">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// Respond to watchList in case players are listed twice in different categories
	if (
		updateEvents.includes("watchList") ||
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season ||
		inputs.playoffs !== state.playoffs ||
		inputs.statType !== state.statType
	) {
		const { categories, stats } = getCategoriesAndStats();
		const playoffs = inputs.playoffs === "playoffs";

		// In theory this should be the same for all sports, like basketball. But for a while FBGM set it to the same value as basketball, which didn't matter since it doesn't influence game sim, but it would mess this up.
		const numPlayersOnCourtFactor = bySport({
			basketball:
				defaultGameAttributes.numPlayersOnCourt / g.get("numPlayersOnCourt"),
			football: 1,
			hockey: 1,
		});

		// To handle changes in number of games, playing time, etc
		const factor =
			(g.get("numGames") / defaultGameAttributes.numGames) *
			numPlayersOnCourtFactor *
			helpers.quarterLengthFactor();

		const gamesPlayedCache = new GamesPlayedCache();

		const outputCategories = categories.map(category => ({
			name: category.name,
			stat: category.stat,
			statProp: category.statProp,
			title: category.title,
			leaders: [] as {
				abbrev: string;
				injury: PlayerInjury | undefined;
				jerseyNumber: string;
				key: number | string;
				nameAbbrev: string;
				pid: number;
				pos: string;
				season: number | undefined;
				stat: number;
				skills: string[];
				tid: number;
				userTeam: boolean;
				watch: boolean;
			}[],
		}));

		// Load all gameslayedCache seasons ahead of time, so we don't make IndexedDB transaction auto commit if doing this dynamically in iterateAllPlayers
		let seasons: number[];
		if (inputs.season === "career") {
			// Nothing to cache
			seasons = [];
		} else if (inputs.season === "all") {
			seasons = range(g.get("startingSeason"), g.get("season") + 1);
		} else {
			seasons = [inputs.season];
		}
		for (const season of seasons) {
			await gamesPlayedCache.loadSeason(season, playoffs);
		}

		await iterateAllPlayers(inputs.season, async (pRaw, season) => {
			const p = await idb.getCopy.playersPlus(pRaw, {
				attrs: ["pid", "nameAbbrev", "injury", "watch", "jerseyNumber"],
				ratings: ["skills", "pos"],
				stats: ["abbrev", "tid", ...stats],
				season: season === "career" ? undefined : season,
				playoffs,
				regularSeason: !playoffs,
				mergeStats: true,
				statType: inputs.statType,
			});
			if (!p) {
				return;
			}

			// Shitty handling of career totals
			if (Array.isArray(p.ratings)) {
				p.ratings = {
					pos: p.ratings.at(-1).pos,
					skills: [],
				};
			}

			let playerStats;
			if (season === "career") {
				if (playoffs) {
					playerStats = p.careerStatsPlayoffs;
				} else {
					playerStats = p.careerStats;
				}
			} else {
				playerStats = p.stats;
			}

			for (let i = 0; i < categories.length; i++) {
				const cat = categories[i];
				const outputCat = outputCategories[i];

				const value = playerStats[cat.statProp];
				const lastValue = outputCat.leaders.at(-1)?.stat;
				if (
					outputCat.leaders.length >= NUM_LEADERS &&
					((cat.sortAscending && value > lastValue) ||
						(!cat.sortAscending && value < lastValue))
				) {
					// Value is not good enough for the top 10
					continue;
				}

				// Test if the player meets the minimum statistical requirements for this category
				let pass = cat.minStats.length === 0 && (!cat.filter || cat.filter(p));

				if (!pass) {
					for (let k = 0; k < cat.minStats.length; k++) {
						// In basketball, everything except gp is a per-game average, so we need to scale them by games played
						let playerValue;
						if (
							!isSport("basketball") ||
							cat.minStats[k] === "gp" ||
							inputs.statType === "totals"
						) {
							playerValue = playerStats[cat.minStats[k]];
						} else if (inputs.statType === "per36") {
							playerValue =
								(playerStats[cat.minStats[k]] *
									playerStats.gp *
									playerStats.min) /
								36;
						} else {
							playerValue = playerStats[cat.minStats[k]] * playerStats.gp;
						}

						const gpTeam = gamesPlayedCache.get(
							season,
							playoffs,
							playerStats.tid,
						);

						if (gpTeam !== undefined) {
							// Special case GP
							if (cat.minStats[k] === "gp") {
								if (
									playerValue / gpTeam >=
									cat.minValue[k] / g.get("numGames")
								) {
									pass = true;
									break; // If one is true, don't need to check the others
								}
							}

							// Other stats
							if (
								playerValue >=
								Math.ceil(
									(cat.minValue[k] * factor * gpTeam) / g.get("numGames"),
								)
							) {
								pass = true;
								break; // If one is true, don't need to check the others
							}
						}
					}
				}

				if (pass) {
					// Players can appear multiple times if looking at all seasons
					const key = inputs.season === "all" ? `${p.pid}|${season}` : p.pid;

					let tid = playerStats.tid;
					let abbrev = playerStats.abbrev;
					if (season === "career") {
						const { legacyTid } = processPlayersHallOfFame([p])[0];
						if (legacyTid >= 0) {
							tid = legacyTid;
							abbrev = g.get("teamInfoCache")[tid]?.abbrev;
						}
					}

					const leader = {
						abbrev,
						injury: p.injury,
						jerseyNumber: p.jerseyNumber,
						key,
						nameAbbrev: p.nameAbbrev,
						pid: p.pid,
						pos: p.ratings.pos,
						season:
							inputs.season === "all" && season !== "career"
								? season
								: undefined,
						stat: playerStats[cat.statProp],
						skills: p.ratings.skills,
						tid,
						userTeam:
							season !== "career" && g.get("userTid", season) === p.stats.tid,
						watch: p.watch,
					};

					// Add to current leaders, truncate, and sort before going on to next player
					outputCat.leaders = outputCat.leaders.slice(0, NUM_LEADERS - 1);
					outputCat.leaders.push(leader);
					if (cat.sortAscending) {
						outputCat.leaders.sort((a, b) => a.stat - b.stat);
					} else {
						outputCat.leaders.sort((a, b) => b.stat - a.stat);
					}
				}
			}
		});

		return {
			categories: outputCategories,
			playoffs: inputs.playoffs,
			season: inputs.season,
			statType: inputs.statType,
		};
	}
};

export default updateLeaders;
