import orderBy from "lodash/orderBy";
import range from "lodash/range";
import { Cache, connectLeague, idb } from "../../db";
import { DIFFICULTY, PHASE, PLAYER } from "../../../common";
import { draft, finances, freeAgents, league, player, team } from "..";
import remove from "./remove";
import {
	defaultGameAttributes,
	g,
	helpers,
	local,
	lock,
	overrides,
	random,
	toUI,
	updatePhase,
	updateStatus,
} from "../../util";
import type {
	PlayerWithoutKey,
	MinimalPlayerRatings,
	GameAttributesLeague,
	League,
	TeamBasic,
	TeamSeasonWithoutKey,
	TeamStatsWithoutKey,
	GameAttributesLeagueWithHistory,
} from "../../../common/types";
import { unwrap, wrap } from "../../util/g";

const confirmSequential = (objs: any, key: string, objectName: string) => {
	const values = new Set();

	for (const obj of objs) {
		const value = obj[key];

		if (typeof value !== "number") {
			throw new Error(`Missing or invalid ${key} for ${objectName}`);
		}

		values.add(value);
	}

	for (let i = 0; i < values.size; i++) {
		if (!values.has(i)) {
			throw new Error(
				`${key} values must be sequential with no gaps starting from 0, but no ${objectName} has a value of ${i}`,
			);
		}
	}

	return values;
};

type LeagueFile = {
	version?: number;
	meta?: any;
	startingSeason: number;
	draftLotteryResults?: any[];
	draftPicks?: any[];
	draftOrder?: any[];
	games?: any[];
	gameAttributes?: any[];
	players?: any[];
	schedule?: any[];
	teams?: any[];
	trade?: any[];
	allStars?: any[];
	releasedPlayers?: any[];
	awards?: any[];
	playoffSeries?: any[];
	negotiations?: any[];
	messages?: any[];
	events?: any[];
	playerFeats?: any[];
	scheduledEvents?: any[];
};

// Creates a league, writing nothing to the database.
export const createWithoutSaving = (
	leagueName: string,
	tid: number,
	leagueFile: LeagueFile,
	shuffleRosters: boolean,
	difficulty: number,
) => {
	const teamsDefault = helpers.getTeamsDefault();

	// Any custom teams?
	let teamInfos: (TeamBasic & {
		stadiumCapacity?: number;
		seasons?: TeamSeasonWithoutKey[];
		stats?: TeamStatsWithoutKey[];
	})[];

	if (leagueFile.teams) {
		for (let i = 0; i < leagueFile.teams.length; i++) {
			const t = leagueFile.teams[i];

			if (!t.colors) {
				if (
					teamsDefault[i] &&
					teamsDefault[i].region === t.region &&
					teamsDefault[i].name === t.name
				) {
					t.colors = teamsDefault[i].colors;
				} else {
					t.colors = ["#000000", "#cccccc", "#ffffff"];
				}
			}
		}

		if (leagueFile.teams.length <= teamsDefault.length) {
			// This probably shouldn't be here, but oh well, backwards compatibility...
			teamInfos = leagueFile.teams.map((t, i) => {
				// If specified on season, copy to root
				if (t.seasons && t.seasons.length > 0) {
					const maybeOnSeason = ["pop", "stadiumCapacity"] as const;
					const ts = t.seasons[t.seasons.length - 1];
					for (const prop of maybeOnSeason) {
						if (ts[prop] !== undefined) {
							t[prop] = ts[prop];
						}
					}
				}

				// Fill in default values as needed
				const t2 = teamsDefault[i];

				for (const prop of helpers.keys(t2)) {
					if (!t.hasOwnProperty(prop)) {
						t[prop] = t2[prop];
					}
				}

				return t;
			});
		} else {
			teamInfos = leagueFile.teams;
		}

		teamInfos = helpers.addPopRank(teamInfos);
	} else {
		teamInfos = teamsDefault;
	}

	// Handle random team
	let userTid = tid;

	if (userTid < 0 || userTid >= teamInfos.length) {
		userTid = random.randInt(0, teamInfos.length - 1);
	}

	const startingSeason = leagueFile.startingSeason;

	const gameAttributes: GameAttributesLeagueWithHistory = {
		...defaultGameAttributes,
		userTid,
		userTids: [userTid],
		season: startingSeason,
		startingSeason,
		leagueName,
		teamAbbrevsCache: teamInfos.map(t => t.abbrev),
		teamImgURLsCache: teamInfos.map(t => t.imgURL),
		teamRegionsCache: teamInfos.map(t => t.region),
		teamNamesCache: teamInfos.map(t => t.name),
		gracePeriodEnd: startingSeason + 2,
		// Can't get fired for the first two seasons
		numTeams: teamInfos.length,
		// Will be 30 if the user doesn't supply custom rosters
		difficulty,
	};

	if (leagueFile.gameAttributes) {
		for (const gameAttribute of leagueFile.gameAttributes) {
			// Set default for anything except team ID and name, since they can be overwritten by form input.
			if (
				gameAttribute.key !== "userTid" &&
				gameAttribute.key !== "leagueName" &&
				gameAttribute.key !== "difficulty"
			) {
				(gameAttributes as any)[gameAttribute.key] = gameAttribute.value;

				// Hack to replace null with -Infinity, cause Infinity is not in JSON spec
				if (
					Array.isArray(gameAttribute.value) &&
					gameAttribute.value.length > 0 &&
					gameAttribute.value[0].start === null
				) {
					gameAttribute.value[0].start = -Infinity;
				}
			}
		}

		// Special case for userTids - don't use saved value if userTid is not in it
		if (!gameAttributes.userTids.includes(gameAttributes.userTid)) {
			gameAttributes.userTids = [gameAttributes.userTid];
		}
	}

	// Extra check for easyDifficultyInPast, so that it won't be overwritten by a league file if the user selects Easy
	// when creating a new league.
	if (difficulty <= DIFFICULTY.Easy) {
		gameAttributes.easyDifficultyInPast = true;
	}

	// Ensure numGamesPlayoffSeries doesn't have an invalid value, relative to numTeams
	const oldNumGames = unwrap(gameAttributes, "numGamesPlayoffSeries");
	const newNumGames = league.getValidNumGamesPlayoffSeries(
		oldNumGames,
		(gameAttributes as any).numPlayoffRounds,
		gameAttributes.numTeams,
	);
	delete (gameAttributes as any).numPlayoffRounds;

	// If we're using some non-default value of numGamesPlayoffSeries, set byes to 0 otherwise it might break for football where the default number of byes is 4
	if (JSON.stringify(oldNumGames) !== JSON.stringify(newNumGames)) {
		gameAttributes.numPlayoffByes = wrap(gameAttributes, "numPlayoffByes", 0);
		gameAttributes.numGamesPlayoffSeries = wrap(
			gameAttributes,
			"numGamesPlayoffSeries",
			newNumGames,
		);
	}

	if (gameAttributes.numDraftRounds < 1) {
		throw new Error("numDraftRounds must be a positive number");
	}

	// Validation of some identifiers
	confirmSequential(teamInfos, "tid", "team");

	// Hacky - put gameAttributes in g so they can be seen by functions called from this function. Later will be properly done with setGameAttributes
	helpers.resetG();
	Object.assign(g, gameAttributes);

	// Needs to be done after g is set
	const teams = helpers.addPopRank(teamInfos).map(t => team.generate(t));

	// Draft picks for the first g.get("numSeasonsFutureDraftPicks") years, as those are the ones can be traded initially
	let draftPicks: any;

	if (leagueFile.draftPicks) {
		draftPicks = leagueFile.draftPicks;

		for (const dp of leagueFile.draftPicks) {
			if (typeof dp.pick !== "number") {
				dp.pick = 0;
			}
		}
	} else {
		draftPicks = [];

		for (let i = 0; i < g.get("numSeasonsFutureDraftPicks"); i++) {
			for (let t = 0; t < teams.length; t++) {
				for (let round = 1; round <= g.get("numDraftRounds"); round++) {
					draftPicks.push({
						tid: t,
						originalTid: t,
						round,
						pick: 0,
						season: startingSeason + i,
					});
				}
			}
		}
	}

	// Import of legacy draftOrder data
	if (
		Array.isArray(leagueFile.draftOrder) &&
		leagueFile.draftOrder.length > 0 &&
		Array.isArray(leagueFile.draftOrder[0].draftOrder) &&
		(g.get("phase") === PHASE.DRAFT_LOTTERY || g.get("phase") === PHASE.DRAFT)
	) {
		for (const dp of leagueFile.draftOrder[0].draftOrder) {
			if (g.get("phase") === PHASE.FANTASY_DRAFT) {
				dp.season = "fantasy";
			} else {
				dp.season = g.get("season");
			}

			draftPicks.push(dp);
		}
	}

	const draftLotteryResults: any = leagueFile.hasOwnProperty(
		"draftLotteryResults",
	)
		? leagueFile.draftLotteryResults
		: [];

	// teams already contains tid, cid, did, region, name, and abbrev. Let's add in the other keys we need for the league, and break out stuff for other object stores
	let scoutingRankTemp;
	const teamSeasons: TeamSeasonWithoutKey[] = [];
	const teamStats: TeamStatsWithoutKey[] = [];

	for (let i = 0; i < teams.length; i++) {
		const t = teams[i];
		if (i === 0) {
			t.disabled = true;
		}
		const teamInfo = teamInfos[i];
		let teamSeasonsLocal: TeamSeasonWithoutKey[];

		if (teamInfo.seasons) {
			teamSeasonsLocal = teamInfo.seasons;
			const last = teamSeasonsLocal[teamSeasonsLocal.length - 1];

			if (last.season !== g.get("season")) {
				last.season = g.get("season");

				// Remove any past seasons that claim to be from this season or a future season
				teamSeasonsLocal = [
					...teamSeasonsLocal.filter(ts => ts.season < last.season),
					last,
				];
			}

			for (const teamSeason of teamSeasonsLocal) {
				// See similar code in teamsPlus
				const copyFromTeamIfUndefined = [
					"cid",
					"did",
					"region",
					"name",
					"abbrev",
					"imgURL",
					"colors",
				] as const;
				for (const key of copyFromTeamIfUndefined) {
					if (teamSeason[key] === undefined) {
						// @ts-ignore
						teamSeason[key] = t[key];
					}
				}
			}
		} else if (!t.disabled) {
			teamSeasonsLocal = [team.genSeasonRow(t)];
			teamSeasonsLocal[0].pop = teamInfo.pop;
			// @ts-ignore
			teamSeasonsLocal[0].stadiumCapacity = teamInfo.stadiumCapacity;
		} else {
			teamSeasonsLocal = [];
		}

		for (const teamSeason of teamSeasonsLocal) {
			teamSeason.tid = t.tid;

			if (typeof teamSeason.stadiumCapacity !== "number") {
				teamSeason.stadiumCapacity =
					t.stadiumCapacity !== undefined
						? t.stadiumCapacity
						: g.get("defaultStadiumCapacity");
			}

			// If this is specified in a league file, we can ignore it because they should all be in order, and sometimes people manually edit the file and include duplicates
			delete teamSeason.rid;

			// teamSeasons = teamSeasons.filter(ts2 => ts2.season !== teamSeason.season);
			teamSeasons.push(teamSeason);
		}

		let teamStatsLocal: TeamStatsWithoutKey[];

		if (teamInfo.stats) {
			teamStatsLocal = teamInfo.stats;
		} else {
			teamStatsLocal = [team.genStatsRow(t.tid)];
		}

		for (const ts of teamStatsLocal) {
			ts.tid = t.tid;

			if (ts.hasOwnProperty("ba")) {
				ts.oppBlk = ts.ba;
				delete ts.ba;
			}

			if (typeof ts.oppBlk !== "number" || Number.isNaN(ts.oppBlk)) {
				ts.oppBlk = 0;
			}

			// teamStats = teamStats.filter(ts2 => ts2.season !== ts.season);
			teamStats.push(ts);
		}

		// Save scoutingRank for later
		if (i === userTid) {
			scoutingRankTemp = finances.getRankLastThree(
				teamSeasonsLocal,
				"expenses",
				"scouting",
			);
		}
	}

	const scoutingRank = scoutingRankTemp;

	if (scoutingRank === undefined) {
		throw new Error("scoutingRank should be defined");
	}

	let trade;

	if (
		leagueFile.hasOwnProperty("trade") &&
		Array.isArray(trade) &&
		trade.length === 1
	) {
		trade = leagueFile.trade;
	} else {
		trade = [
			{
				rid: 0,
				teams: [
					{
						tid: userTid,
						pids: [],
						pidsExcluded: [],
						dpids: [],
						dpidsExcluded: [],
					},
					{
						tid: userTid === 0 ? 1 : 0,
						// Load initial trade view with the lowest-numbered non-user team (so, either 0 or 1).
						pids: [],
						pidsExcluded: [],
						dpids: [],
						dpidsExcluded: [],
					},
				],
			},
		];
	}

	const games = leagueFile.games ? leagueFile.games : [];

	for (const gm of games) {
		// Fix missing +/-, blocks against in boxscore
		if (!gm.teams[0].hasOwnProperty("ba")) {
			gm.teams[0].ba = 0;
			gm.teams[1].ba = 0;
		}

		for (const t of gm.teams) {
			for (const p of t.players) {
				if (!p.hasOwnProperty("ba")) {
					p.ba = 0;
				}

				if (!p.hasOwnProperty("pm")) {
					p.pm = 0;
				}
			}
		}
	}

	// Delete gid from schedule in case it is somehow conflicting with games, because schedule gids are not referenced anywhere else but game gids are
	if (leagueFile.schedule) {
		for (const matchup of leagueFile.schedule) {
			delete matchup.gid;
		}
	}

	// These object stores are blank by default
	const toMaybeAdd = [
		"allStars",
		"releasedPlayers",
		"awards",
		"schedule",
		"playoffSeries",
		"negotiations",
		"messages",
		"games",
		"events",
		"playerFeats",
	] as const;
	const leagueData: any = {};

	for (const store of toMaybeAdd) {
		leagueData[store] = leagueFile[store] ? leagueFile[store] : [];
	}

	// Do this weird shit rather than genBaseMoods to avoid database access
	const teamSeasonsForBaseMoods = orderBy(
		teamSeasons.filter(ts => ts.season === gameAttributes.season),
		["tid"],
	);
	const baseMoods = teamSeasonsForBaseMoods.map(ts =>
		player.genBaseMood(ts, false),
	);
	let players: PlayerWithoutKey[];

	if (leagueFile.players) {
		// Use pre-generated players, filling in attributes as needed
		if (shuffleRosters) {
			// Assign the team ID of all players to the 'playerTids' array.
			// Check tid to prevent draft prospects from being swapped with established players
			const playerTids = leagueFile.players
				.filter(p => p.tid > PLAYER.FREE_AGENT)
				.map(p => p.tid);

			// Shuffle the teams that players are assigned to.
			random.shuffle(playerTids);

			for (const p of leagueFile.players) {
				p.transactions = [];

				if (p.tid > PLAYER.FREE_AGENT) {
					p.tid = playerTids.pop();

					if (p.stats && p.stats.length > 0) {
						p.stats[p.stats.length - 1].tid = p.tid;

						if (p.statsTids) {
							p.statsTids.push(p.tid);
						} else {
							p.statsTids = [p.tid];
						}
					}
				}
			}
		}

		players = leagueFile.players.map(p0 => {
			const p: PlayerWithoutKey = player.augmentPartialPlayer(
				{ ...p0 },
				scoutingRank,
				leagueFile.version,
			);

			if (p.tid >= g.get("numTeams")) {
				p.tid = PLAYER.FREE_AGENT;
			}

			return p;
		});
	} else {
		players = [];

		// Generate past 20 years of draft classes

		const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? -1 : 0;
		const NUM_PAST_SEASONS = 20 + seasonOffset;

		// Keep synced with Dropdown.js seasonsAndOldDrafts and addRelatives
		const rookieSalaries = draft.getRookieSalaries();
		const keptPlayers: PlayerWithoutKey<MinimalPlayerRatings>[] = [];

		for (
			let numYearsAgo = NUM_PAST_SEASONS;
			numYearsAgo > seasonOffset;
			numYearsAgo--
		) {
			let draftClass = draft.genPlayersWithoutSaving(
				g.get("season"),
				scoutingRank,
			);

			// Very rough simulation of a draft
			draftClass = orderBy(draftClass, ["value"], ["desc"]);
			const tids = range(g.get("numTeams"));
			random.shuffle(tids);

			for (let i = 0; i < draftClass.length; i++) {
				const p = draftClass[i];
				let round = 0;
				let pick = 0;
				const roundTemp = Math.floor(i / g.get("numTeams")) + 1;

				if (roundTemp <= g.get("numDraftRounds")) {
					round = roundTemp;
					pick = (i % g.get("numTeams")) + 1;
				}

				// Save these for later, because player.develop will overwrite them

				const pot = p.ratings[0].pot;
				const ovr = p.ratings[0].ovr;
				const skills = p.ratings[0].skills;

				// Develop player and see if he is still non-retired

				player.develop(p, numYearsAgo, true);
				player.updateValues(p);

				// Run shouldRetire 4 times to simulate past shouldRetire calls
				if (
					(!player.shouldRetire(p) &&
						!player.shouldRetire(p) &&
						!player.shouldRetire(p) &&
						!player.shouldRetire(p)) ||
					numYearsAgo <= 3
				) {
					// Do this before developing, to save ratings
					p.draft = {
						round,
						pick,
						tid: round === 0 ? -1 : tids[pick - 1],
						year: g.get("season") - numYearsAgo,
						originalTid: round === 0 ? -1 : tids[pick - 1],
						pot,
						ovr,
						skills,
					};

					if (round === 0) {
						// Guarantee contracts for undrafted players are overwritten below
						p.contract.exp = -Infinity;
					} else {
						const years = 4 - round;

						// 2 years for 2nd round, 3 years for 1st round;
						player.setContract(
							p,
							{
								amount: rookieSalaries[i],
								exp: g.get("season") - numYearsAgo + years,
							},
							false,
						);
					}

					keptPlayers.push(p);
				}
			}
		}

		// (g.get("maxRosterSize") + 1) for wiggle room (need min contract FAs sometimes)
		if (keptPlayers.length < (g.get("maxRosterSize") + 1) * g.get("numTeams")) {
			throw new Error("Not enough players!");
		}

		const numPlayerPerTeam = g.get("maxRosterSize") - 2;

		// 13 for basketball
		const maxNumFreeAgents = Math.round(
			(g.get("numTeams") / 3) * g.get("maxRosterSize"),
		);

		// 150 for basketball
		// Add players to teams or free agency
		keptPlayers.sort((a, b) => b.value - a.value);

		// Keep track of number of players on each team
		const numPlayersByTid: Record<number, number> = {};

		for (const tid2 of range(g.get("numTeams"))) {
			numPlayersByTid[tid2] = 0;
		}

		const addPlayerToTeam = (p: PlayerWithoutKey, tid2: number) => {
			numPlayersByTid[tid2] += 1;
			p.tid = tid2;
			player.addStatsRow(p, g.get("phase") === PHASE.PLAYOFFS);

			// Keep rookie contract, or no?
			if (p.contract.exp >= g.get("season")) {
				player.setContract(p, p.contract, true);
			} else {
				player.setContract(p, player.genContract(p, true), true);
			}

			players.push(p);
		};

		const probStillOnDraftTeam = (p: PlayerWithoutKey) => {
			let prob = 0; // Probability a player is still on his draft team

			const numYearsAgo = g.get("season") - p.draft.year;

			if (typeof p.draft.round === "number") {
				if (numYearsAgo < 8) {
					prob = (8 - numYearsAgo) / 8; // 87.5% for last year, 75% for 2 years ago, etc
				} else {
					prob = 0.125;
				}

				if (p.draft.round > 1) {
					prob *= 0.75;
				}

				if (p.draft.round > 3) {
					prob *= 0.75;
				}

				if (p.draft.round > 5) {
					prob *= 0.75;
				}

				if (p.draft.round > 7) {
					prob *= 0.75;
				}
			}

			return prob;
		};

		// Drafted players kept with own team, with some probability
		for (let i = 0; i < numPlayerPerTeam * g.get("numTeams"); i++) {
			const p = keptPlayers[i];

			if (
				p.draft.tid >= 0 &&
				Math.random() < probStillOnDraftTeam(p) &&
				numPlayersByTid[p.draft.tid] < numPlayerPerTeam
			) {
				addPlayerToTeam(p, p.draft.tid);
				keptPlayers.splice(i, 1);
			}
		}

		// Then add other players, up to the limit
		while (true) {
			// Random order tids, so no team is a superpower
			const tids = range(g.get("numTeams"));
			random.shuffle(tids);
			let numTeamsDone = 0;

			for (const currentTid of tids) {
				if (numPlayersByTid[currentTid] >= numPlayerPerTeam) {
					numTeamsDone += 1;
					continue;
				}

				const p = freeAgents.getBest(
					players.filter(p2 => p2.tid === currentTid),
					keptPlayers,
				);

				if (p) {
					addPlayerToTeam(p, currentTid);
				} else {
					console.log(currentTid, "can't find player");
					numTeamsDone += 1;
				}
			}

			if (numTeamsDone === g.get("numTeams")) {
				break;
			}
		}

		// Adjustment for hard cap - lower contracts for teams above cap
		if (g.get("hardCap")) {
			for (const tid2 of range(g.get("numTeams"))) {
				const roster = players.filter(p => p.tid === tid2);
				let payroll = roster.reduce((total, p) => total + p.contract.amount, 0);

				while (payroll > g.get("salaryCap")) {
					let foundAny = false;

					for (const p of roster) {
						if (p.contract.amount >= g.get("minContract") + 50) {
							p.contract.amount -= 50;
							payroll -= 50;
							foundAny = true;
						}
					}

					if (!foundAny) {
						throw new Error(
							"Invalid combination of hardCap, salaryCap, and minContract",
						);
					}
				}
			}
		}

		// Finally, free agents
		for (let i = 0; i < maxNumFreeAgents; i++) {
			const p = keptPlayers[i];

			if (p) {
				// So half will be eligible to retire after the first season
				p.yearsFreeAgent = Math.random() > 0.5 ? 1 : 0;

				player.setContract(p, player.genContract(p, false), false);
				player.addToFreeAgents(p, g.get("phase"), baseMoods);
				players.push(p);
			}
		}
	}

	// See if imported roster has draft picks included. If so, create less than 70 (scaled for number of teams)
	const baseNumPlayers = Math.round(
		(g.get("numDraftRounds") * g.get("numTeams") * 7) / 6,
	);

	// 70 for basketball 2 round draft
	let createUndrafted1 = baseNumPlayers;
	let createUndrafted2 = baseNumPlayers;
	let createUndrafted3 = baseNumPlayers;
	const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? 1 : 0;

	for (const p of players) {
		if (p.tid === PLAYER.UNDRAFTED) {
			if (p.draft.year === g.get("season") + seasonOffset) {
				createUndrafted1 -= 1;
			} else if (p.draft.year === g.get("season") + seasonOffset + 1) {
				createUndrafted2 -= 1;
			} else if (p.draft.year === g.get("season") + seasonOffset + 2) {
				createUndrafted3 -= 1;
			}
		}
	}

	// If the draft has already happened this season but next year's class hasn't been bumped up, don't create any PLAYER.UNDRAFTED
	if (g.get("phase") !== PHASE.FANTASY_DRAFT) {
		if (
			createUndrafted1 > 0 &&
			(g.get("phase") <= PHASE.DRAFT_LOTTERY ||
				g.get("phase") >= PHASE.RESIGN_PLAYERS)
		) {
			const draftClass = draft.genPlayersWithoutSaving(
				g.get("season") + seasonOffset,
				scoutingRank,
				createUndrafted1,
			);
			players = players.concat(draftClass);
		}

		if (createUndrafted2 > 0) {
			const draftClass = draft.genPlayersWithoutSaving(
				g.get("season") + 1 + seasonOffset,
				scoutingRank,
				createUndrafted2,
			);
			players = players.concat(draftClass);
		}

		if (createUndrafted3 > 0) {
			const draftClass = draft.genPlayersWithoutSaving(
				g.get("season") + 2 + seasonOffset,
				scoutingRank,
				createUndrafted3,
			);
			players = players.concat(draftClass);
		}
	}

	// Unless we got strategy from a league file, calculate it here
	for (let i = 0; i < teamInfos.length; i++) {
		// @ts-ignore
		if (teamInfos[i].strategy === undefined) {
			const teamPlayers = players
				.filter(p => p.tid === i)
				.map(p => ({ ratings: p.ratings[p.ratings.length - 1] }));
			const ovr = overrides.core.team.ovr!(teamPlayers);
			teams[i].strategy = ovr >= 60 ? "contending" : "rebuilding";
		}
	}

	const scheduledEvents = leagueFile.scheduledEvents
		? leagueFile.scheduledEvents
		: [];

	return Object.assign(leagueData, {
		draftLotteryResults,
		draftPicks,
		gameAttributes,
		players,
		scheduledEvents,
		teamSeasons,
		teamStats,
		teams,
		trade,
	});
};

/**
 * Create a new league.
 *
 * @memberOf core.league
 * @param {string} name The name of the league.
 * @param {number} tid The team ID for the team the user wants to manage (or -1 for random).
 */
const create = async ({
	name,
	tid,
	leagueFile,
	shuffleRosters = false,
	difficulty = 0,
	importLid,
}: {
	name: string;
	tid: number;
	leagueFile: LeagueFile;
	shuffleRosters?: boolean;
	difficulty?: number;
	importLid?: number | undefined | null;
}): Promise<number> => {
	const leagueData = createWithoutSaving(
		name,
		tid,
		leagueFile,
		shuffleRosters,
		difficulty,
	);

	let phaseText;

	if (
		leagueFile.hasOwnProperty("meta") &&
		leagueFile.meta.hasOwnProperty("phaseText")
	) {
		phaseText = leagueFile.meta.phaseText;
	} else {
		phaseText = "";
	}

	const userTid = leagueData.gameAttributes.userTid;
	const l: League = {
		name,
		tid: userTid,
		phaseText,
		teamName: leagueData.teams[userTid].name,
		teamRegion: leagueData.teams[userTid].region,
		heartbeatID: undefined,
		heartbeatTimestamp: undefined,
		difficulty,
		created: new Date(),
		lastPlayed: new Date(),
	};

	if (importLid !== undefined && importLid !== null) {
		const oldLeague = await idb.meta.get("leagues", importLid);
		await remove(importLid);
		l.lid = importLid;
		if (oldLeague) {
			l.created = oldLeague.created;
			l.starred = oldLeague.starred;
		}
	}

	const lid = await idb.meta.add("leagues", l);
	idb.league = await connectLeague(lid);

	// These wouldn't be needed here, except the beforeView logic is fucked up
	lock.reset();
	local.reset();

	// Clear old game attributes from g, to make sure the new ones are saved to the db in setGameAttributes
	helpers.resetG();
	g.setWithoutSavingToDB("lid", lid);
	leagueData.gameAttributes.lid = lid;
	await toUI("resetLeague", []);

	if (idb.cache) {
		idb.cache.stopAutoFlush();
	}

	idb.cache = new Cache();
	idb.cache.newLeague = true;
	await idb.cache.fill(leagueData.gameAttributes.season);

	// Hack! Need to not include lid in the update here, because then it gets sent to the UI and is seen in Controller before the URL changes, which interferes with running beforeLeague when the first view in the new league is loaded. lol
	const gameAttributesToUpdate: Partial<GameAttributesLeague> = {
		...leagueData.gameAttributes,
	};
	delete gameAttributesToUpdate.lid;

	// Handle gameAttributes special, to get extra functionality from setGameAttributes and because it's not in the database native format in leagueData (object, not array like others).
	await league.setGameAttributes(gameAttributesToUpdate);

	// orderBy is to ensure games is before schedule, so that games are added before schedule to the database, so Cache._maxIds.schedule can be set to Cache.maxIds.game, so gids never conflict
	const orderedLeagueData = orderBy(Object.entries(leagueData), 0);

	for (const [store, records] of orderedLeagueData) {
		if (store === "gameAttributes" || !Array.isArray(records)) {
			continue;
		}

		for (const record of records) {
			// @ts-ignore
			await idb.cache[store].put(record);
		}
	}

	// If no players were uploaded in custom league file, add some relatives!
	if (leagueFile.players === undefined) {
		const players = await idb.cache.players.getAll();

		for (const p of players) {
			await player.addRelatives(p);
		}
	}

	const skipNewPhase = leagueFile.gameAttributes
		? leagueFile.gameAttributes.some(ga => ga.key === "phase")
		: false;

	if (!skipNewPhase) {
		await updatePhase();
		await updateStatus("Idle");

		// Auto sort rosters
		for (const t of leagueData.teams) {
			let noRosterOrderSet = true;
			if (process.env.SPORT === "basketball" && leagueFile.players) {
				for (const p of leagueFile.players) {
					if (p.tid === t.tid && typeof p.rosterOrder === "number") {
						noRosterOrderSet = false;
						break;
					}
				}
			}

			// If league file has players, don't auto sort even if skipNewPhase is false
			if (noRosterOrderSet || !g.get("userTids").includes(t.tid)) {
				await overrides.core.team.rosterAutoSort!(t.tid);
			}
		}
	}

	await idb.cache.flush();
	idb.cache.startAutoFlush();
	local.leagueLoaded = true;
	return lid;
};

export default create;
