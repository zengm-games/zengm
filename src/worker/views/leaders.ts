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
			nameOverride?: string;
			statProp: string;
			minStats: string[];
			minValue: number[];
			sortAscending?: true;
			filter?: (p: any) => boolean;
		}[]
	>({
		basketball: [
			{
				statProp: "pts",
				minStats: ["gp", "pts"],
				minValue: [70, 1400],
			},
			{
				statProp: "trb",
				minStats: ["gp", "trb"],
				minValue: [70, 800],
			},
			{
				statProp: "ast",
				minStats: ["gp", "ast"],
				minValue: [70, 400],
			},
			{
				statProp: "fg",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "fga",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "fgp",
				minStats: ["fg"],
				minValue: [300 * g.get("twoPointAccuracyFactor")],
			},
			{
				statProp: "tp",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "tpa",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "tpp",
				minStats: ["tp"],
				minValue: [Math.max(55 * g.get("threePointTendencyFactor"), 12)],
			},
			{
				statProp: "ft",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "fta",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "ftp",
				minStats: ["ft"],
				minValue: [125],
			},
			{
				statProp: "blk",
				minStats: ["gp", "blk"],
				minValue: [70, 100],
			},
			{
				statProp: "stl",
				minStats: ["gp", "stl"],
				minValue: [70, 125],
			},
			{
				statProp: "min",
				minStats: ["gp", "min"],
				minValue: [70, 2000],
			},
			{
				statProp: "per",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "ewa",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				nameOverride: "Win Shares / 48 Mins",
				statProp: "ws48",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "ows",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "dws",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "ws",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "obpm",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "dbpm",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "bpm",
				minStats: ["min"],
				minValue: [2000],
			},
			{
				statProp: "vorp",
				minStats: ["min"],
				minValue: [2000],
			},
		],
		football: [
			{
				statProp: "pssYds",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "pssYdsPerAtt",
				minStats: ["pss"],
				minValue: [14 * 16],
			},
			{
				statProp: "cmpPct",
				minStats: ["pss"],
				minValue: [14 * 16],
			},
			{
				statProp: "pssTD",
				nameOverride: "Passing TDs",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "pssInt",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "qbRat",
				minStats: ["pss"],
				minValue: [14 * 16],
			},
			{
				statProp: "rusYds",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "rusYdsPerAtt",
				minStats: ["rus"],
				minValue: [6.25 * 16],
			},
			{
				statProp: "rusTD",
				nameOverride: "Rushing TDs",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "recYds",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "recYdsPerAtt",
				minStats: ["rec"],
				minValue: [1.875 * 16],
			},
			{
				statProp: "recTD",
				nameOverride: "Receiving TDs",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "ydsFromScrimmage",
				nameOverride: "Yards From Scrimmage",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "rusRecTD",
				nameOverride: "Rushing and Receiving TDs",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "defTck",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "defSk",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "defInt",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "defFmbFrc",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "defFmbRec",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "av",
				minStats: [],
				minValue: [],
			},
		],
		hockey: [
			{
				statProp: "g",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "a",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "pts",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "pm",
				minStats: [],
				minValue: [],
				filter: p => p.ratings.pos !== "G",
			},
			{
				statProp: "pim",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "min",
				minStats: [],
				minValue: [],
				filter: p => p.ratings.pos !== "G",
			},
			{
				statProp: "blk",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "hit",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "tk",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "gv",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "svPct",
				minStats: ["sv"],
				minValue: [800],
			},
			{
				statProp: "gaa",
				minStats: ["sv"],
				minValue: [800],
				sortAscending: true,
			},
			{
				statProp: "so",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "gc",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "ops",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "dps",
				minStats: [],
				minValue: [],
			},
			{
				statProp: "gps",
				minStats: [],
				minValue: [],
			},
			{
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
			nameOverride: category.nameOverride,
			statProp: category.statProp,
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
