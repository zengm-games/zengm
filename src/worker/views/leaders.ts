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
	PlayerFiltered,
	PlayerInjury,
	PlayerStatType,
	UpdateEvents,
	ViewInput,
} from "../../common/types";
import { groupByUnique, range } from "../../common/utils";
import addFirstNameShort from "../util/addFirstNameShort";
import { season } from "../core";

export const getCategoriesAndStats = (onlyStat?: string) => {
	let categories = bySport<
		{
			titleOverride?: string;
			stat: string;
			minStats?: Record<string, number>;
			sortAscending?: true;
			filter?: (p: any) => boolean;
		}[]
	>({
		baseball: [
			{
				stat: "ba",
			},
			{
				stat: "hr",
			},
			{
				stat: "rbi",
			},
			{
				stat: "r",
			},
			{
				stat: "h",
			},
			{
				stat: "2b",
			},
			{
				stat: "3b",
			},
			{
				stat: "sb",
			},
			{
				stat: "bb",
			},
			{
				stat: "obp",
			},
			{
				stat: "slg",
			},
			{
				stat: "ops",
			},
			{
				stat: "tb",
			},
			{
				stat: "w",
			},
			{
				stat: "l",
			},
			{
				stat: "era",
			},
			{
				stat: "sho",
			},
			{
				stat: "sv",
			},
			{
				stat: "ip",
			},
			{
				stat: "hrPit",
			},
			{
				stat: "bbPit",
			},
			{
				stat: "soPit",
			},
			{
				stat: "pc",
			},
			{
				stat: "bk",
			},
			{
				stat: "wp",
			},
			{
				stat: "bf",
			},
			{
				stat: "fip",
			},
			{
				stat: "whip",
			},
			{
				stat: "h9",
			},
			{
				stat: "hr9",
			},
			{
				stat: "bb9",
			},
			{
				stat: "so9",
			},
			{
				stat: "pc9",
			},
			{
				stat: "sow",
			},
			{
				stat: "rbat",
			},
			{
				stat: "rbr",
			},
			{
				stat: "rfldTot",
			},
			{
				stat: "rpit",
			},
			{
				stat: "war",
			},
		],
		basketball: [
			{
				stat: "pts",
			},
			{
				stat: "trb",
			},
			{
				stat: "ast",
			},
			{
				stat: "fg",
			},
			{
				stat: "fga",
			},
			{
				stat: "fgp",
			},
			{
				stat: "tp",
			},
			{
				stat: "tpa",
			},
			{
				stat: "tpp",
			},
			{
				stat: "ft",
			},
			{
				stat: "fta",
			},
			{
				stat: "ftp",
			},
			{
				stat: "blk",
			},
			{
				stat: "stl",
			},
			{
				stat: "min",
			},
			{
				stat: "per",
			},
			{
				stat: "ewa",
			},
			{
				stat: "ws48",
				titleOverride: "Win Shares / 48 Mins",
			},
			{
				stat: "ows",
			},
			{
				stat: "dws",
			},
			{
				stat: "ws",
			},
			{
				stat: "obpm",
			},
			{
				stat: "dbpm",
			},
			{
				stat: "bpm",
			},
			{
				stat: "vorp",
			},
			{
				stat: "onOff100",
			},
		],
		football: [
			{
				stat: "pssYds",
			},
			{
				stat: "pssYdsPerAtt",
			},
			{
				stat: "cmpPct",
			},
			{
				stat: "pssTD",
				titleOverride: "Passing TDs",
			},
			{
				stat: "pssInt",
			},
			{
				stat: "qbRat",
			},
			{
				stat: "rusYds",
			},
			{
				stat: "rusYdsPerAtt",
			},
			{
				stat: "rusTD",
				titleOverride: "Rushing TDs",
			},
			{
				stat: "recYds",
			},
			{
				stat: "recYdsPerRec",
			},
			{
				stat: "recTD",
				titleOverride: "Receiving TDs",
			},
			{
				stat: "ydsFromScrimmage",
				titleOverride: "Yards From Scrimmage",
			},
			{
				stat: "rusRecTD",
				titleOverride: "Rushing and Receiving TDs",
			},
			{
				stat: "defTck",
			},
			{
				stat: "defSk",
			},
			{
				stat: "defInt",
			},
			{
				stat: "defFmbFrc",
			},
			{
				stat: "defFmbRec",
			},
			{
				stat: "av",
			},
		],
		hockey: [
			{
				stat: "g",
			},
			{
				stat: "a",
			},
			{
				stat: "pts",
			},
			{
				stat: "pm",
			},
			{
				stat: "pim",
			},
			{
				stat: "min",
			},
			{
				stat: "blk",
			},
			{
				stat: "hit",
			},
			{
				stat: "tk",
			},
			{
				stat: "gv",
			},
			{
				stat: "svPct",
			},
			{
				stat: "gaa",
			},
			{
				stat: "so",
			},
			{
				stat: "gc",
			},
			{
				stat: "ops",
			},
			{
				stat: "dps",
			},
			{
				stat: "gps",
			},
			{
				stat: "ps",
			},
		],
	});

	if (onlyStat) {
		categories = categories.filter(row => row.stat === onlyStat);
		if (categories.length === 0) {
			throw new Error(`Invalid stat "${onlyStat}"`);
		}
	}

	const leaderRequirements = season.getLeaderRequirements();

	const augmentedCategories = categories.map(category => {
		if (leaderRequirements[category.stat]) {
			return {
				...category,
				...leaderRequirements[category.stat],
			};
		}

		return category;
	});

	// Always include GP, since it's used to scale minStats based on season length
	const statsSet = new Set<string>(["gp"]);
	for (const { minStats, stat } of augmentedCategories) {
		statsSet.add(stat);

		if (minStats) {
			for (const stat of Object.keys(minStats)) {
				statsSet.add(stat);
			}
		}
	}
	const stats = Array.from(statsSet);

	return {
		categories: augmentedCategories,
		stats,
	};
};

// Calculate the number of games played for each team, which is used to test if a player qualifies as a league leader
export class GamesPlayedCache {
	regularSeasonCache: Record<number, Record<number, number>>;
	playoffsCache: Record<number, Record<number, number>>;

	constructor() {
		this.regularSeasonCache = {};
		this.playoffsCache = {};
	}

	private straightNumGames(season: number, playoffs: boolean) {
		// Current year, regular season, completed season -> we already know how many games each team played, from numGames
		return (
			!playoffs &&
			season === g.get("season") &&
			g.get("phase") >= PHASE.PLAYOFFS
		);
	}

	async loadSeasons(seasons: number[], playoffs: boolean) {
		for (const season of seasons) {
			if (this.straightNumGames(season, playoffs)) {
				continue;
			}

			// In the playoffs, if we're in the first round or later (not the play-in), set the number of games to the minimum number of games to win a first round series (or the number of games so far). That way you won't see someone who played like 1 game in the play-in tournament leading in points per game after the entire playoffs.
			let minGpPlayoffs = 0;
			if (playoffs) {
				const playoffSeries = await idb.getCopy.playoffSeries(
					{ season },
					"noCopyCache",
				);

				// This only matters if there is a play-in tournament
				if (playoffSeries?.playIns) {
					// Find any non-bye first round series and see how many games have been played so far
					for (const series of playoffSeries.series[0]) {
						if (series.away) {
							// Number of games played so far - can't require more than this!
							const numGamesFirstRoundSoFar = series.home.won + series.away.won;

							// Number of games in a first round sweep
							const numGamesMinAfterFirstRound = helpers.numGamesToWinSeries(
								g.get("numGamesPlayoffSeries", season)[0],
							);

							minGpPlayoffs = Math.min(
								numGamesFirstRoundSoFar,
								numGamesMinAfterFirstRound,
							);

							// No need to look for more, since series schedules are always in sync (all series play on same days)
							break;
						}
					}
				}
			}

			const teams = await idb.getCopies.teamsPlus({
				attrs: ["tid"],
				stats: ["gp"],
				season,
				playoffs,
				regularSeason: !playoffs,
			});

			const cache: Record<number, number> = {};
			for (const t of teams) {
				if (playoffs) {
					cache[t.tid] = Math.max(minGpPlayoffs, t.stats.gp);
				} else {
					cache[t.tid] = t.stats.gp;
				}
			}

			if (playoffs) {
				this.playoffsCache[season] = cache;
			} else {
				this.regularSeasonCache[season] = cache;
			}
		}
	}

	get(
		season: number,
		type: "regularSeason" | "playoffs" | "combined",
		tid: number,
		career: boolean,
	): number | null {
		if (type === "combined") {
			return (
				(this.get(season, "regularSeason", tid, career) ?? 0) +
				(this.get(season, "playoffs", tid, career) ?? 0)
			);
		}

		const playoffs = type === "playoffs";

		if (career) {
			if (playoffs) {
				// Arbitrary - two full playoffs runs
				const numGamesPlayoffSeries = g.get("numGamesPlayoffSeries", season);
				let sum = 0;
				for (const games of numGamesPlayoffSeries) {
					sum += games;
				}
				return 2 * sum;
			}

			// Arbitrary - 4 seasons, scaled to the number of seasons played
			const numSeasons = Math.min(1 + season - g.get("startingSeason"), 4);
			let numGames;
			if (this.regularSeasonCache[season]) {
				numGames = Math.max(...Object.values(this.regularSeasonCache[season]));
			} else {
				numGames = g.get("numGames");
			}
			return numGames * numSeasons;
		}

		if (this.straightNumGames(season, playoffs)) {
			return g.get("numGames");
		}

		if (playoffs) {
			return this.playoffsCache[season]?.[tid] ?? null;
		}

		return this.regularSeasonCache[season]?.[tid] ?? null;
	}
}

export const iterateAllPlayers = async (
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

type Category = ReturnType<typeof getCategoriesAndStats>["categories"][number];

// Accept season even when career is true, because for progressive leaders we need to know the season being evaluated, otherwise we might want multiple seasons of stats to determine the all-time leader when there is only one season available
export const playerMeetsCategoryRequirements = ({
	career,
	cat,
	gamesPlayedCache,
	p,
	playerStats,
	seasonType,
	season,
	statType,
}: {
	career: boolean;
	cat: Category;
	gamesPlayedCache: GamesPlayedCache;
	p: PlayerFiltered;
	playerStats: Record<string, any>;
	seasonType: "regularSeason" | "playoffs" | "combined";
	season: number;
	statType: PlayerStatType;
}) => {
	const numPlayersOnCourtFactor = bySport({
		baseball: 1,
		basketball:
			defaultGameAttributes.numPlayersOnCourt / g.get("numPlayersOnCourt"),
		football: 1,
		hockey: 1,
	});

	// To handle changes in number of games, playing time, etc
	const factor =
		(g.get("numGames") / defaultGameAttributes.numGames[0].value) *
		numPlayersOnCourtFactor *
		helpers.quarterLengthFactor();

	// Need to undo numPlayersOnCourtFactor for testing "min", because you don't get more minutes with less players on the court, unlike most other stats
	const minFactor = 1 / numPlayersOnCourtFactor;

	// Test if the player meets the minimum statistical requirements for this category
	let pass = !cat.minStats && (!cat.filter || cat.filter(p));

	if (!pass && cat.minStats) {
		for (const [minStat, minValue] of Object.entries(cat.minStats)) {
			// In basketball, everything except gp is a per-game average, so we need to scale them by games played
			let playerValue;
			if (!isSport("basketball") || minStat === "gp" || statType === "totals") {
				playerValue = playerStats[minStat];
			} else if (statType === "per36") {
				playerValue =
					(playerStats[minStat] * playerStats.gp * playerStats.min) / 36;
			} else {
				playerValue = playerStats[minStat] * playerStats.gp;
			}

			const gpTeam = gamesPlayedCache.get(
				season,
				seasonType,
				playerStats.tid,
				career,
			);

			if (gpTeam === null) {
				// Just include everyone, since there was some issue getting gamesPlayed (such as playoffs season before startingSeason)
				pass = true;
				break;
			}

			// Special case GP
			if (minStat === "gp") {
				if (
					playerValue / gpTeam >=
					minValue / defaultGameAttributes.numGames[0].value
				) {
					pass = true;
					break; // If one is true, don't need to check the others
				}
			} else {
				// Other stats
				if (
					playerValue >=
					Math.ceil(
						(minValue * factor * (minStat === "min" ? minFactor : 1) * gpTeam) /
							g.get("numGames"),
					)
				) {
					pass = true;
					break; // If one is true, don't need to check the others
				}
			}
		}
	}

	// Unless we're sorting ascending, ignore value of 0 because that could mean missing data
	if (pass && !cat.sortAscending && playerStats[cat.stat] === 0) {
		pass = false;
	}

	return pass;
};

export type Leader = {
	abbrev: string;
	hof: boolean;
	injury: PlayerInjury | undefined;
	jerseyNumber: string;
	key: number | string;
	firstName: string;
	firstNameShort?: string;
	lastName: string;
	pid: number;
	pos: string;
	retiredYear: number;
	season: number | undefined;
	stat: number;
	skills: string[];
	tid: number;
	userTeam: boolean;
	watch: number;
};

export const leadersAddFirstNameShort = <
	LocalLeader extends {
		firstName: string;
		lastName: string;
	},
	T extends {
		leaders: LocalLeader[];
	},
>(
	rows: T[],
) =>
	rows.map(row => ({
		...row,
		leaders: addFirstNameShort(row.leaders),
	}));

const NUM_LEADERS = 10;

const updateLeaders = async (
	inputs: ViewInput<"leaders">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	// Respond to watchList in case players are listed twice in different categories
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("watchList") ||
		(inputs.season === g.get("season") && updateEvents.includes("gameSim")) ||
		inputs.season !== state.season ||
		inputs.playoffs !== state.playoffs ||
		inputs.statType !== state.statType
	) {
		const { categories, stats } = getCategoriesAndStats();

		const outputCategories = categories.map(category => ({
			titleOverride: category.titleOverride,
			stat: category.stat,
			leaders: [] as Leader[],
		}));

		// Load all gameslayedCache seasons ahead of time, so we don't make IndexedDB transaction auto commit if doing this dynamically in iterateAllPlayers
		const gamesPlayedCache = new GamesPlayedCache();
		let seasons: number[];
		if (inputs.season === "career") {
			// Nothing to cache
			seasons = [];
		} else if (inputs.season === "all") {
			seasons = range(g.get("startingSeason"), g.get("season") + 1);
		} else {
			seasons = [inputs.season];
		}

		if (inputs.playoffs === "combined") {
			await gamesPlayedCache.loadSeasons(seasons, false);
			await gamesPlayedCache.loadSeasons(seasons, true);
		} else {
			await gamesPlayedCache.loadSeasons(
				seasons,
				inputs.playoffs === "playoffs",
			);
		}

		await iterateAllPlayers(inputs.season, async (pRaw, season) => {
			const p = await idb.getCopy.playersPlus(pRaw, {
				attrs: [
					"pid",
					"firstName",
					"lastName",
					"injury",
					"watch",
					"jerseyNumber",
					"hof",
					"retiredYear",
				],
				ratings: ["skills", "pos"],
				stats: ["abbrev", "tid", ...stats],
				season: season === "career" ? undefined : season,
				playoffs: inputs.playoffs === "playoffs",
				regularSeason: inputs.playoffs === "regularSeason",
				combined: inputs.playoffs === "combined",
				mergeStats: "totOnly",
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
				if (inputs.playoffs === "playoffs") {
					playerStats = p.careerStatsPlayoffs;
				} else if (inputs.playoffs === "combined") {
					playerStats = p.careerStatsCombined;
				} else {
					playerStats = p.careerStats;
				}
			} else {
				playerStats = p.stats;
			}

			for (let i = 0; i < categories.length; i++) {
				const cat = categories[i];
				const outputCat = outputCategories[i];

				const value = playerStats[cat.stat];
				const lastValue = outputCat.leaders.at(-1)?.stat;
				if (
					lastValue !== undefined &&
					outputCat.leaders.length >= NUM_LEADERS &&
					((cat.sortAscending && value > lastValue) ||
						(!cat.sortAscending && value < lastValue))
				) {
					// Value is not good enough for the top 10
					continue;
				}

				const pass = playerMeetsCategoryRequirements({
					career: season === "career",
					cat,
					gamesPlayedCache,
					p,
					playerStats,
					seasonType: inputs.playoffs,
					season: season === "career" ? g.get("season") : season,
					statType: inputs.statType,
				});

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

					const userTid =
						season !== "career" ? g.get("userTid", season) : g.get("userTid");

					const leader = {
						abbrev,
						hof: p.hof,
						injury: p.injury,
						jerseyNumber: p.jerseyNumber,
						key,
						firstName: p.firstName,
						lastName: p.lastName,
						pid: p.pid,
						pos: p.ratings.pos,
						retiredYear: p.retiredYear,
						season:
							inputs.season === "all" && season !== "career"
								? season
								: undefined,
						stat: playerStats[cat.stat],
						skills: p.ratings.skills,
						tid,
						userTeam: userTid === tid,
						watch: p.watch,
					};

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

		const highlightActiveAndHOF =
			inputs.season === "career" ||
			inputs.season === "all" ||
			inputs.season < g.get("season");

		return {
			categories: leadersAddFirstNameShort(outputCategories),
			highlightActiveAndHOF,
			playoffs: inputs.playoffs,
			season: inputs.season,
			statType: inputs.statType,
		};
	}
};

export default updateLeaders;
