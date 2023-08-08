import loadDataBasketball, { type Basketball } from "./loadData.basketball";
import loadStatsBasketball from "./loadStats.basketball";
import formatScheduledEvents from "./formatScheduledEvents";
import { groupBy } from "../../../common/groupBy";
import orderBy from "lodash-es/orderBy";
import range from "lodash-es/range";
import type {
	GetLeagueOptions,
	DraftPickWithoutKey,
	DraftLotteryResult,
	GameAttributesLeague,
} from "../../../common/types";
import { defaultGameAttributes, helpers, random } from "../../util";
import {
	isSport,
	LEAGUE_DATABASE_VERSION,
	PHASE,
	PLAYER,
	unwrapGameAttribute,
} from "../../../common";
import { player, team } from "..";
import { legendsInfo } from "./getLeagueInfo";
import getDraftProspects from "./getDraftProspects";
import formatPlayerFactory from "./formatPlayerFactory";
import nerfDraftProspect from "./nerfDraftProspect";
import getOnlyRatings from "./getOnlyRatings";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";
import addRelatives from "./addRelatives";
import addRetiredJerseyNumbers from "./addRetiredJerseyNumbers";
import genPlayoffSeries from "./genPlayoffSeries";
import getGameAttributes from "./getGameAttributes";
import getAwards from "./getAwards";
import setDraftProspectRatingsBasedOnDraftPosition from "./setDraftProspectRatingsBasedOnDraftPosition";
import getInjury from "./getInjury";
import { averageSalary } from "./averageSalary";

export const MIN_SEASON = 1947;
export const LATEST_SEASON = 2024;
export const FIRST_SEASON_WITH_ALEXNOOB_ROSTERS = 2020;
const FREE_AGENTS_SEASON = 2020;

const getLeague = async (options: GetLeagueOptions) => {
	if (!isSport("basketball")) {
		throw new Error(`Not supported for ${process.env.SPORT}`);
	}

	const basketball = await loadDataBasketball();

	// NO PLAYERS CAN BE ADDED AFTER CALLING THIS, otherwise there will be pid collisions
	const addFreeAgents = (
		players: {
			pid: number;
			tid: number;
		}[],
		season: number,
	) => {
		// Free agents were generated in 2020, so offset
		const numExistingFreeAgents = players.filter(
			p => p.tid === PLAYER.FREE_AGENT,
		).length;
		if (numExistingFreeAgents < 50) {
			let pid = Math.max(...players.map(p => p.pid));

			const freeAgents2 = helpers.deepCopy(
				basketball.freeAgents.slice(0, 50 - numExistingFreeAgents),
			);
			for (const p of freeAgents2) {
				let offset = FREE_AGENTS_SEASON - season;

				// Make them a bit older so they suck
				offset += 5;

				p.born.year -= offset;
				p.draft.year -= offset;
				pid += 1;
				p.pid = pid;
			}
			players.push(...freeAgents2);
		}
	};

	const scheduledEventsAll = [
		...basketball.scheduledEventsGameAttributes,
		...basketball.scheduledEventsTeams,
	];

	if (options.type === "real") {
		const { scheduledEvents, initialGameAttributes, initialTeams } =
			formatScheduledEvents(scheduledEventsAll, {
				gameAttributesHistory: options.realStats === "all",
				keepAllTeams: options.realStats === "all",
				season: options.season,
				phase: options.phase,
			});

		const formatPlayer = await formatPlayerFactory(
			basketball,
			options,
			options.season,
			initialTeams,
			-1,
		);

		const ratingsRows = basketball.ratings.filter(row => {
			if (
				options.realStats === "all" ||
				options.realStats === "allActive" ||
				options.realStats === "allActiveHOF"
			) {
				return row.season <= options.season;
			}

			if (options.realStats === "lastSeason") {
				const lastSeason =
					options.phase > PHASE.REGULAR_SEASON
						? options.season
						: options.season - 1;
				return row.season >= lastSeason && row.season <= options.season;
			}

			return row.season === options.season;
		});

		let groupedRatings = Object.values(groupBy(ratingsRows, "slug")).filter(
			allRatings => {
				// Ignore players in upcoming draft
				const bio = basketball.bios[allRatings[0].slug];
				if (
					bio &&
					(bio.draftYear > options.season ||
						(bio.draftYear === options.season &&
							options.phase < PHASE.AFTER_DRAFT))
				) {
					return false;
				}

				return true;
			},
		);

		const hofSlugs = new Set();
		if (options.realStats === "allActive") {
			// Only keep players who are active this season
			groupedRatings = groupedRatings.filter(allRatings => {
				const lastSeason = allRatings.at(-1)?.season;
				return lastSeason === options.season;
			});
		} else if (
			options.realStats === "allActiveHOF" ||
			options.realStats === "all"
		) {
			// Populate hofSlugs for use later
			for (const [slug, awards] of Object.entries(basketball.awards)) {
				if (awards) {
					for (const award of awards) {
						if (award.type === "Inducted into the Hall of Fame") {
							hofSlugs.add(slug);
							continue;
						}
					}
				}
			}

			if (options.realStats === "allActiveHOF") {
				// Only keep players who are active this season or in the HoF
				groupedRatings = groupedRatings.filter(allRatings => {
					const lastRatings = allRatings.at(-1)!;
					return (
						lastRatings.season === options.season ||
						hofSlugs.has(lastRatings.slug)
					);
				});
			}
		}

		const players = groupedRatings.map(ratings => {
			const p = formatPlayer(ratings);

			const retiredUntil = ratings.at(-1)?.retiredUntil;
			if (retiredUntil !== undefined) {
				scheduledEvents.push({
					type: "unretirePlayer",
					season: retiredUntil - 1,
					phase: PHASE.FREE_AGENCY,
					info: {
						pid: p.pid,
					},
				});
			}

			return p;
		});

		// Find draft prospects, which can't include any active players
		const lastPID = Math.max(...players.map(p => p.pid));
		const draftProspects = await getDraftProspects(
			basketball,
			players,
			initialTeams,
			scheduledEvents,
			lastPID,
			0,
			options,
		);

		players.push(...draftProspects);

		// Injuries - do this here rather than in formatPlayerFactory so we have access to initialGameAttributes
		const getUnwrappedGameAttributeOrDefault = <
			Key extends keyof GameAttributesLeague,
		>(
			key: Key,
		): GameAttributesLeague[Key] => {
			if (initialGameAttributes[key]) {
				return unwrapGameAttribute(initialGameAttributes, key);
			}

			return unwrapGameAttribute(defaultGameAttributes, key);
		};
		for (const p of players) {
			if (p.srID) {
				const injury = getInjury({
					injuries: basketball.injuries,
					slug: p.srID,
					season: options.season,
					phase: options.phase,
					numGames: getUnwrappedGameAttributeOrDefault("numGames"),
					numGamesPlayoffSeries: getUnwrappedGameAttributeOrDefault(
						"numGamesPlayoffSeries",
					),
					draftProspect: p.tid === PLAYER.UNDRAFTED,
					draftYear: p.draft.year,
				});
				if (injury) {
					p.injury = injury;
				}
			}
		}

		if (options.randomDebuts) {
			const toRandomize = players.filter(p => {
				if (p.tid === PLAYER.FREE_AGENT || p.tid === PLAYER.RETIRED) {
					return false;
				}

				if (options.randomDebutsKeepCurrent) {
					return p.tid < 0;
				}

				return true;
			});

			const draftYears = toRandomize.map(p => p.draft.year);
			random.shuffle(draftYears);

			const tids = toRandomize.filter(p => p.tid >= 0).map(p => p.tid);
			random.shuffle(tids);

			for (let i = 0; i < toRandomize.length; i++) {
				const p = toRandomize[i];
				const diff = draftYears[i] - p.draft.year;
				p.draft.year = draftYears[i];
				p.born.year += diff;

				p.draft.tid = -1;
				p.draft.originalTid = -1;
				p.draft.round = 0;
				p.draft.pick = 0;

				if (
					p.draft.year < options.season ||
					(p.draft.year === options.season && options.phase > PHASE.DRAFT)
				) {
					// Active player on a team
					const tid = tids.pop();
					if (tid === undefined) {
						throw new Error("Not enough tids");
					}

					p.tid = tid;

					const targetRatingsSeason = options.season - diff;

					const rows = basketball.ratings.filter(row => row.slug === p.srID);
					if (rows.length === 0) {
						throw new Error(`No ratings found for "${p.srID}"`);
					}

					// If possible, use ratings from exact age
					let ratings = rows.find(row => row.season === targetRatingsSeason);

					// Otherwise, find closest
					if (!ratings) {
						const sorted = orderBy(
							rows,
							row => Math.abs(row.season - targetRatingsSeason),
							"asc",
						);
						ratings = sorted[0];
					}

					p.ratings = [getOnlyRatings(ratings)];
				} else {
					// Draft prospect
					p.tid = PLAYER.UNDRAFTED;
					const rookieRatings = basketball.ratings.find(
						row => row.slug === p.srID,
					);
					if (!rookieRatings) {
						throw new Error(`No ratings found for "${p.srID}"`);
					}
					const currentRatings = getOnlyRatings(rookieRatings);
					nerfDraftProspect(currentRatings);
					p.ratings = [currentRatings];
					const bio = basketball.bios[p.srID];
					if (
						options.type === "real" &&
						options.realDraftRatings === "draft" &&
						bio
					) {
						const age = p.draft.year + 1 - p.born.year;
						setDraftProspectRatingsBasedOnDraftPosition(
							currentRatings,
							age,
							bio,
						);
					}

					// Delete stuff that may have been added on, for randomDebutsKeepCurrent if stats are kept
					p.stats = [];
					p.awards = [];
					p.salaries = [];
				}
			}
		}

		const gameAttributes = {
			...getGameAttributes(initialGameAttributes, options),
			season: options.season,
		};

		const getDraftPickTeams = (
			dp: Basketball["draftPicks"][number][number],
		) => {
			const t = initialTeams.find(
				t => oldAbbrevTo2020BBGMAbbrev(t.srID) === dp.abbrev,
			);
			if (!t) {
				throw new Error(`Team not found for draft pick abbrev ${dp.abbrev}`);
			}

			let t2;
			if (dp.originalAbbrev) {
				t2 = initialTeams.find(
					t => oldAbbrevTo2020BBGMAbbrev(t.srID) === dp.originalAbbrev,
				);
				if (!t2) {
					throw new Error(
						`Team not found for draft pick abbrev ${dp.originalAbbrev}`,
					);
				}
			} else {
				t2 = t;
			}

			return [t, t2];
		};

		let draftPicks: DraftPickWithoutKey[] | undefined;
		let draftLotteryResults: DraftLotteryResult[] | undefined;
		// Special case for 2020+ because we only have traded draft picks for the "current" season, we don't store history
		const includeDraftPicks2020AndFuture =
			options.season >= 2020 &&
			!options.randomDebuts &&
			!!basketball.draftPicks[options.season];
		const includeRealizedDraftPicksThisSeason = options.phase === PHASE.DRAFT;
		if (includeDraftPicks2020AndFuture || includeRealizedDraftPicksThisSeason) {
			draftPicks = basketball.draftPicks[options.season]
				.filter(dp => {
					if (dp.round > 2) {
						return false;
					}

					// For alexnoob traded draft picks, don't include current season if starting after draft
					if (
						options.phase > PHASE.DRAFT &&
						dp.season !== undefined &&
						dp.season === options.season
					) {
						return false;
					}

					// Handle draft picks with trade history
					if (dp.range) {
						// Return true for null because we only test the first/last range component with the before/after function
						const isBeforeRequestedSeasonPhase = (
							rangeComponent: [number, number] | null,
						) => {
							if (rangeComponent === null) {
								return true;
							}
							return (
								rangeComponent[0] < options.season ||
								(rangeComponent[0] === options.season &&
									rangeComponent[1] <= options.phase)
							);
						};
						const isAfterRequestedSeasonPhase = (
							rangeComponent: [number, number] | null,
						) => {
							if (rangeComponent === null) {
								return true;
							}
							return (
								rangeComponent[0] > options.season ||
								(rangeComponent[0] === options.season &&
									rangeComponent[1] >= options.phase)
							);
						};

						if (
							isBeforeRequestedSeasonPhase(dp.range[0]) &&
							isAfterRequestedSeasonPhase(dp.range[1])
						) {
							return true;
						}

						return false;
					}

					return true;
				})
				.map(dp => {
					const [t, t2] = getDraftPickTeams(dp);

					return {
						tid: t.tid,
						originalTid: t2.tid,
						round: dp.round,
						pick:
							includeRealizedDraftPicksThisSeason && dp.pick !== undefined
								? dp.pick
								: 0,
						season: dp.season ?? options.season,
					};
				});
		}
		if (includeRealizedDraftPicksThisSeason) {
			draftLotteryResults = [
				{
					season: options.season,
					draftType: "dummy",
					result: [],
				},
			];
		}

		let playoffSeries;
		let playoffSeriesRange: [number, number] | undefined;
		if (options.realStats === "all") {
			playoffSeriesRange = [MIN_SEASON, options.season - 1];
			if (options.phase >= PHASE.PLAYOFFS) {
				playoffSeriesRange[1] += 1;
			}
		} else if (options.phase >= PHASE.PLAYOFFS) {
			playoffSeriesRange = [options.season, options.season];
		}

		if (playoffSeriesRange) {
			playoffSeries = [];
			for (
				let season = playoffSeriesRange[0];
				season <= playoffSeriesRange[1];
				season++
			) {
				const completeBracket =
					season < options.season ||
					(season === options.season && options.phase > PHASE.PLAYOFFS);

				// Kind of wasteful to re-run this N times, since each time builds off the previous one...
				const { initialTeams: initialTeamsSeason } = formatScheduledEvents(
					scheduledEventsAll,
					{
						keepAllTeams: options.realStats === "all",
						onlyTeams: true,
						season,
						phase: PHASE.PLAYOFFS,
					},
				);

				const seasonPlayoffSeries = genPlayoffSeries(
					basketball,
					initialTeamsSeason,
					season,
					completeBracket,
				);
				playoffSeries.push(seasonPlayoffSeries);

				// Find who actually won title
				let champTid: number | undefined;
				if (completeBracket) {
					const { home, away } =
						seasonPlayoffSeries.series[
							seasonPlayoffSeries.series.length - 1
						][0];
					if (away) {
						champTid = (home.won > away.won ? home : away).tid;
					}
				}

				for (const t of initialTeamsSeason) {
					const t2 = initialTeams.find(t2 => t2.tid === t.tid);
					if (!t2) {
						throw new Error("t2 not found");
					}
					const teamSeasonData =
						basketball.teamSeasons[season][oldAbbrevTo2020BBGMAbbrev(t.srID)];
					if (!teamSeasonData) {
						// Must be an expansion team
						continue;
					}

					const teamSeason = team.genSeasonRow(
						t,
						undefined,
						season,
						defaultGameAttributes.defaultStadiumCapacity,
					);
					const keys = [
						"won",
						"lost",
						"wonHome",
						"lostHome",
						"wonAway",
						"lostAway",
						"wonDiv",
						"lostDiv",
						"wonConf",
						"lostConf",
					] as const;
					for (const key of keys) {
						teamSeason[key] = teamSeasonData[key];
					}
					teamSeason.gpHome = teamSeason.wonHome + teamSeason.lostHome;

					if (
						teamSeason.season < options.season ||
						(teamSeason.season === options.season &&
							options.phase >= PHASE.PLAYOFFS)
					) {
						teamSeason.avgAge = teamSeasonData.avgAge;
					}

					teamSeason.srID = t.srID;

					for (let i = 0; i < seasonPlayoffSeries.series.length; i++) {
						const round = seasonPlayoffSeries.series[i];
						for (const matchup of round) {
							if (
								(matchup.away && matchup.away.tid === t.tid) ||
								matchup.home.tid === t.tid
							) {
								if (i === 0) {
									teamSeason.clinchedPlayoffs = "x";
								}
								teamSeason.playoffRoundsWon = i;
							}
						}
					}

					if (champTid !== undefined && teamSeason.tid === champTid) {
						teamSeason.playoffRoundsWon += 1;
					}

					if (!t2.seasons) {
						t2.seasons = [];
					}
					t2.seasons.push(teamSeason);
				}
			}

			// Add dummy entry for current season, otherwise league.create gets confused by all the other entries and thinks the last one should be moved to the current season
			if (options.phase === PHASE.PRESEASON) {
				const activeTeams = initialTeams.filter(t => !t.disabled);

				for (const t of activeTeams) {
					const teamSeason = team.genSeasonRow(
						t,
						undefined,
						options.season,
						defaultGameAttributes.defaultStadiumCapacity,
					);

					if (!t.seasons) {
						t.seasons = [];
					}
					t.seasons.push(teamSeason);
				}
			}
		}

		// If starting in a playoff where there is a play-in tournament, add the play-in tournament before
		if (options.phase === PHASE.PLAYOFFS && playoffSeries) {
			const playIns = basketball.playIns[options.season];
			if (playIns) {
				const getTidAndWinp = (abbrev: string) => {
					const t = initialTeams.find(
						t => oldAbbrevTo2020BBGMAbbrev(t.srID) === abbrev,
					);
					if (!t) {
						throw new Error("Missing team");
					}
					const teamSeason = basketball.teamSeasons[options.season][abbrev];
					if (!teamSeason) {
						throw new Error("Missing teamSeason");
					}
					const winp = helpers.calcWinp(teamSeason);

					return {
						tid: t.tid,
						winp,
					};
				};

				const currentPlayoffSeries = playoffSeries.at(-1);
				if (currentPlayoffSeries) {
					currentPlayoffSeries.playIns = playIns.map((playIn, cid) => {
						return playIn.map(matchup => {
							return {
								home: {
									cid,
									seed: matchup.seeds[0],
									won: 0,
									...getTidAndWinp(matchup.abbrevs[0]),
								},
								away: {
									cid,
									seed: matchup.seeds[1],
									won: 0,
									...getTidAndWinp(matchup.abbrevs[1]),
								},
							};
						});
					});

					const playInSeeds = [7, 8];
					for (const round of currentPlayoffSeries.series) {
						for (const matchup of round) {
							const away = matchup.away;
							if (away && playInSeeds.includes(away.seed)) {
								away.pendingPlayIn = true;

								const playInGames = currentPlayoffSeries.playIns[away.cid];
								let tid;
								for (const matchup of playInGames) {
									if (matchup.home.seed === away.seed) {
										tid = matchup.home.tid;
										break;
									} else if (matchup.away?.seed === away.seed) {
										tid = matchup.away.tid;
										break;
									}
								}

								// Update teamSeason for this team - they did not make the playoffs yet!
								const teamSeason = initialTeams[away.tid].seasons?.at(-1);
								if (teamSeason) {
									teamSeason.playoffRoundsWon = -1;
								}

								// Needs to be the correct tid from the 7/8 play-in seeds, or it won't be recognized correctly
								if (tid !== undefined) {
									away.tid = tid;
								}
							}
						}
					}

					currentPlayoffSeries.currentRound = -1;
				}
			}
		}

		const awards = getAwards(basketball.awards, players, initialTeams, options);

		// Mark players as retired - don't delete, so we have full season stats and awards.
		// This is done down here because it needs to be after the playoffSeries stuff adds the "Won Championship" award.
		// Skip 2021 because we don't have 2021 data yet!
		if (
			options.phase > PHASE.PLAYOFFS &&
			options.season < 2021 &&
			!options.randomDebuts
		) {
			const nextSeasonSlugs = new Set();
			for (const row of basketball.ratings) {
				if (row.season === options.season + 1) {
					nextSeasonSlugs.add(row.slug);
				}
			}

			for (const p of players) {
				if (p.tid >= 0 && !nextSeasonSlugs.has(p.srID)) {
					p.tid = PLAYER.RETIRED;
					(p as any).retiredYear = options.season;
				}
			}
		}

		// Manually add HoF to retired players who do eventually make the HoF, but have not yet been inducted by the tim ethis season started.
		// This needs to be after the code above which sets retired players, otherwise starting after the playoffs will result in players who retired that year never making the HoF.
		if (hofSlugs.size > 0) {
			for (const p of players) {
				if (hofSlugs.has(p.srID) && !p.hof && p.tid === PLAYER.RETIRED) {
					p.hof = 1;
					if (!p.awards) {
						p.awards = [];
					}

					const season =
						options.phase <= PHASE.PLAYOFFS
							? options.season - 1
							: options.season;

					p.awards.push({
						type: "Inducted into the Hall of Fame",
						season,
					});
				}
			}
		}

		// Assign expansion draft players to their teams
		if (
			options.phase >= PHASE.DRAFT_LOTTERY &&
			basketball.expansionDrafts[options.season] &&
			!options.randomDebuts
		) {
			for (const [abbrev, slugs] of Object.entries(
				basketball.expansionDrafts[options.season],
			)) {
				const t = initialTeams.find(
					t => abbrev === oldAbbrevTo2020BBGMAbbrev(t.abbrev),
				);
				if (!t) {
					throw new Error("Team not found");
				}

				t.firstSeasonAfterExpansion = options.season + 1;

				for (const p of players) {
					if (slugs.includes(p.srID)) {
						p.tid = t.tid;
					}
				}
			}
		}

		// Assign drafted players to their teams
		if (
			options.phase > PHASE.DRAFT &&
			!options.randomDebuts &&
			options.season < LATEST_SEASON
		) {
			for (const dp of basketball.draftPicks[options.season]) {
				if (!dp.slug) {
					continue;
				}

				const p = players.find(p => p.srID === dp.slug);
				if (!p) {
					throw new Error("Player not found");
				}
				if (dp.pick === undefined) {
					throw new Error("No pick number");
				}

				const [t, t2] = getDraftPickTeams(dp);

				p.tid = t.tid;
				p.draft = {
					round: dp.round,
					pick: dp.pick,
					tid: t.tid,
					year: options.season,
					originalTid: t2.tid,
				};

				// Contract - this should work pretty well for players with contract data. Other players (like from the old days) will have this randomly generated in augmentPartialPlayer.
				const salaryRow = basketball.salaries.find(
					row => row.start <= options.season + 1 && row.slug === p.srID,
				);
				if (salaryRow) {
					let minYears =
						defaultGameAttributes.rookieContractLengths[dp.round - 1] ??
						defaultGameAttributes.rookieContractLengths[
							defaultGameAttributes.rookieContractLengths.length - 1
						];

					// Offset because it starts next season
					minYears += 1;

					let exp = salaryRow.exp;

					// Bound at 5 year contract
					if (exp > options.season + 5) {
						exp = options.season + 5;
					}

					p.contract = {
						amount: averageSalary(salaryRow, options.season + 1, exp),
						exp,
						rookie: true,
					};

					// Bound at minYears, but do this after calling averageSalary in case a player was released before minYears
					if (p.contract.exp < options.season + minYears) {
						p.contract.exp = options.season + minYears;
					}
				}

				const currentRatings = p.ratings[0];
				currentRatings.season = options.season;
				nerfDraftProspect(currentRatings);
				if (options.type === "real" && options.realDraftRatings === "draft") {
					const age = currentRatings.season! - p.born.year;
					setDraftProspectRatingsBasedOnDraftPosition(currentRatings, age, {
						draftRound: p.draft.round,
						draftPick: p.draft.pick,
					});
				}
			}
		}

		addRelatives(players, basketball.relatives);
		addFreeAgents(players, options.season);
		addRetiredJerseyNumbers({
			teams: initialTeams,
			players,
			season: options.season,
			phase: options.phase,
			allBios: basketball.bios,
			allRetiredJerseyNumbers: basketball.retiredJerseyNumbers,
		});

		let seasonLeaders;
		if (options.realStats !== "none") {
			let seasonLeadersSeasons;

			if (options.realStats === "lastSeason") {
				// Different from mostRecentLeadersSeason to keep in sync with the season that player stats get pulled from in formatPlayer
				const statsSeason =
					options.phase > PHASE.REGULAR_SEASON
						? options.season
						: options.season - 1;

				seasonLeadersSeasons = [statsSeason];
			} else {
				const mostRecentLeadersSeason =
					options.phase > PHASE.PLAYOFFS ? options.season : options.season - 1;

				seasonLeadersSeasons = range(MIN_SEASON, mostRecentLeadersSeason + 1);
			}

			const basketballStats = await loadStatsBasketball();
			seasonLeaders = [];
			for (const season of seasonLeadersSeasons) {
				if (basketballStats.seasonLeaders[season]) {
					seasonLeaders.push({
						season,
						...basketballStats.seasonLeaders[season],
					});
				}
			}
		}

		return {
			version: LEAGUE_DATABASE_VERSION,
			startingSeason: options.realStats === "all" ? MIN_SEASON : options.season,
			players,
			teams: initialTeams,
			scheduledEvents,
			gameAttributes,
			draftPicks,
			draftLotteryResults,
			playoffSeries,
			awards,
			seasonLeaders,
		};
	} else if (options.type === "legends") {
		const NUM_PLAYERS_PER_TEAM = 15;

		const season = legendsInfo[options.decade].end;
		const { initialGameAttributes, initialTeams } = formatScheduledEvents(
			scheduledEventsAll,
			{
				keepAllTeams: false,
				season,
			},
		);

		const hasQueens = initialTeams.some(t => t.name === "Queens");

		const formatPlayer = await formatPlayerFactory(
			basketball,
			options,
			season,
			initialTeams,
			-1,
		);

		let players = orderBy(
			basketball.ratings,
			ratings => player.ovr(ratings as any),
			"desc",
		)
			.filter(
				ratings =>
					ratings.season >= legendsInfo[options.decade].start &&
					ratings.season <= legendsInfo[options.decade].end,
			)
			.map(ratings =>
				formatPlayer(ratings, {
					hasQueens,
				}),
			)
			.filter(p => p.tid >= 0);

		const keptPlayers = [];
		const numPlayersPerTeam = Array(initialTeams.length).fill(0);
		while (
			players.length > 0 &&
			keptPlayers.length < NUM_PLAYERS_PER_TEAM * initialTeams.length
		) {
			const p = players.shift();
			if (p && numPlayersPerTeam[p.tid] < NUM_PLAYERS_PER_TEAM) {
				keptPlayers.push(p);
				numPlayersPerTeam[p.tid] += 1;

				// Remove other years of this player
				players = players.filter(p2 => p2.srID !== p.srID);
			}
		}

		const gameAttributes = getGameAttributes(initialGameAttributes, options);

		addRelatives(keptPlayers, basketball.relatives);
		addFreeAgents(keptPlayers, season);

		return {
			version: 37,
			startingSeason: season,
			players: keptPlayers,
			teams: initialTeams,
			gameAttributes,
		};
	}

	// @ts-expect-error
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeague;
