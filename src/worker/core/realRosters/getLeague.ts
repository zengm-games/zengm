import loadDataBasketball, { Basketball } from "./loadData.basketball";
import formatScheduledEvents from "./formatScheduledEvents";
import groupBy from "lodash-es/groupBy";
import orderBy from "lodash-es/orderBy";
import type {
	GetLeagueOptions,
	DraftPickWithoutKey,
	DraftLotteryResult,
} from "../../../common/types";
import { defaultGameAttributes, helpers, random } from "../../util";
import { isSport, PHASE, PLAYER } from "../../../common";
import { player, team } from "..";
import { legendsInfo } from "./getLeagueInfo";
import getDraftProspects from "./getDraftProspects";
import formatPlayerFactory from "./formatPlayerFactory";
import nerfDraftProspect from "./nerfDraftProspect";
import getOnlyRatings from "./getOnlyRatings";
import oldAbbrevTo2020BBGMAbbrev from "./oldAbbrevTo2020BBGMAbbrev";
import addRelatives from "./addRelatives";
import genPlayoffSeries from "./genPlayoffSeries";
import getGameAttributes from "./getGameAttributes";
import getAwards from "./getAwards";

export const LATEST_SEASON = 2021;
export const LATEST_SEASON_WITH_DRAFT_POSITIONS = 2020;
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
		const {
			scheduledEvents,
			initialGameAttributes,
			initialTeams,
		} = formatScheduledEvents(scheduledEventsAll, {
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

		let groupedRatings = Object.values(groupBy(ratingsRows, "slug"));
		if (options.realStats === "allActive") {
			// Only keep players who are active this season
			groupedRatings = groupedRatings.filter(allRatings => {
				const lastRatings = allRatings[allRatings.length - 1];
				return lastRatings.season === options.season;
			});
		} else if (options.realStats === "allActiveHOF") {
			// Only keep players who are active this season or in the HoF

			const hofSlugs = new Set();
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

			groupedRatings = groupedRatings.filter(allRatings => {
				const lastRatings = allRatings[allRatings.length - 1];
				return (
					lastRatings.season === options.season ||
					hofSlugs.has(lastRatings.slug)
				);
			});
		}

		const players = groupedRatings.map(ratings =>
			formatPlayer(ratings, {
				randomDebuts: options.randomDebuts,
			}),
		);

		// Heal injuries, if necessary
		let gamesToHeal = 0;
		if (options.phase >= PHASE.PLAYOFFS) {
			// Regular season
			gamesToHeal +=
				initialGameAttributes.numGames ?? defaultGameAttributes.numGames;
		}
		if (options.phase >= PHASE.DRAFT) {
			// Offseason
			gamesToHeal += defaultGameAttributes.numGames;
		}
		if (gamesToHeal > 0) {
			for (const p of players) {
				if (!p.injury) {
					continue;
				}
				if (p.injury.gamesRemaining <= gamesToHeal) {
					p.injury = {
						type: "Healthy",
						gamesRemaining: 0,
					};
				} else {
					p.injury.gamesRemaining -= gamesToHeal;
				}
			}
		}

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

		if (options.randomDebuts) {
			const toRandomize = players.filter(p => p.tid !== PLAYER.FREE_AGENT);

			const draftYears = toRandomize.map(p => p.draft.year);
			random.shuffle(draftYears);

			const tids = toRandomize.filter(p => p.tid >= 0).map(p => p.tid);
			random.shuffle(tids);

			for (let i = 0; i < toRandomize.length; i++) {
				const p = toRandomize[i];
				const diff = draftYears[i] - p.draft.year;
				p.draft.year = draftYears[i];
				p.born.year += diff;

				if (p.draft.year < options.season) {
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
					const ratings = getOnlyRatings(rookieRatings);
					nerfDraftProspect(ratings);
					p.ratings = [ratings];
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
			playoffSeriesRange = [1947, options.season - 1];
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

				const { initialTeams: initialTeamsSeason } = formatScheduledEvents(
					scheduledEventsAll,
					{
						keepAllTeams: options.realStats === "all",
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
					const { home, away } = seasonPlayoffSeries.series[
						seasonPlayoffSeries.series.length - 1
					][0];
					if (away) {
						champTid = (home.won > away.won ? home : away).tid;
					}
				}

				const numActiveTeams = initialTeamsSeason.filter(t => !t.disabled)
					.length;

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
						numActiveTeams,
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
						activeTeams.length,
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

		const awards = getAwards(basketball.awards, players, initialTeams, options);

		// Mark players as retired - don't delete, so we have full season stats and awards.
		// This is done down here because it needs to be after the playoffSeries stuff adds the "Won Championship" award.
		// Skip 2021 because we don't have 2021 data yet!
		if (options.phase > PHASE.PLAYOFFS && options.season < 2021) {
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

		// Assign expansion draft players to their teams
		if (
			options.phase >= PHASE.DRAFT_LOTTERY &&
			basketball.expansionDrafts[options.season]
		) {
			for (const [abbrev, slugs] of Object.entries(
				basketball.expansionDrafts[options.season],
			)) {
				const t = initialTeams.find(t => abbrev === t.abbrev);
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
		if (options.phase > PHASE.DRAFT) {
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
					p.contract = {
						amount: salaryRow.amount / 1000,
						exp: salaryRow.exp,
					};

					let minYears =
						defaultGameAttributes.rookieContractLengths[dp.round - 1] ??
						defaultGameAttributes.rookieContractLengths[
							defaultGameAttributes.rookieContractLengths.length - 1
						];

					// Offset because it starts next season
					minYears += 1;

					if (p.contract.exp < options.season + minYears) {
						p.contract.exp = options.season + minYears;
					}

					if (p.contract.exp > options.season + 5) {
						// Bound at 5 year contract
						p.contract.exp = options.season + 5;
					}
				}
			}
		}

		addRelatives(players, basketball.relatives);
		addFreeAgents(players, options.season);

		return {
			version: 37,
			startingSeason: options.realStats === "all" ? 1947 : options.season,
			players,
			teams: initialTeams,
			scheduledEvents,
			gameAttributes,
			draftPicks,
			draftLotteryResults,
			playoffSeries,
			awards,
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
					legends: true,
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

	// @ts-ignore
	throw new Error(`Unknown type "${options.type}"`);
};

export default getLeague;
