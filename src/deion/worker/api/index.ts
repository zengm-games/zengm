import { csvFormatRows } from "d3-dsv";
import flatten from "lodash/flatten";
import range from "lodash/range";
import { PHASE, PHASE_TEXT, PLAYER, getCols } from "../../common";
import actions from "./actions";
import processInputs from "./processInputs";
import {
	allStar,
	contractNegotiation,
	draft,
	finances,
	league,
	phase,
	player,
	team,
	trade,
} from "../core";
import { connectMeta, idb, iterate } from "../db";
import {
	achievement,
	beforeView,
	checkAccount,
	checkChanges,
	checkNaNs,
	env,
	face,
	g,
	helpers,
	local,
	lock,
	overrides,
	random,
	updatePlayMenu,
	updateStatus,
	toUI,
} from "../util";
import views from "../views";
import {
	Conditions,
	Env,
	GameAttributesLeague,
	Local,
	LockName,
	Player,
	PlayerWithoutKey,
	UpdateEvents,
	TradeTeams,
	MinimalPlayerRatings,
	Relative,
	TradeTeam,
	Options,
} from "../../common/types";

const acceptContractNegotiation = async (
	pid: number,
	amount: number,
	exp: number,
): Promise<string | undefined | null> => {
	return contractNegotiation.accept(pid, amount, exp);
};

const addTeam = async (
	cid: number,
	did: number,
): Promise<{
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	imgURL?: string;
	pop: number;
	stadiumCapacity: number;
	colors: [string, string, string];
}> => {
	const pop = 1;
	const t = team.generate({
		tid: g.get("numTeams"),
		cid,
		did,
		region: "Region",
		name: "Name",
		abbrev: "ZZZ",
		pop,
		imgURL: undefined,
	});
	const teamSeason = team.genSeasonRow(t.tid);
	teamSeason.pop = pop;
	teamSeason.stadiumCapacity = g.get("defaultStadiumCapacity");
	const teamStats = team.genStatsRow(t.tid);
	await idb.cache.teams.put(t);
	await idb.cache.teamSeasons.put(teamSeason);
	await idb.cache.teamStats.put(teamStats);
	await league.setGameAttributes({
		numTeams: g.get("numTeams") + 1,
		teamAbbrevsCache: [...g.get("teamAbbrevsCache"), t.abbrev],
		teamRegionsCache: [...g.get("teamRegionsCache"), t.region],
		teamNamesCache: [...g.get("teamNamesCache"), t.name],
		teamImgURLsCache: [...g.get("teamImgURLsCache"), t.imgURL],
	});
	const dpOffset = g.get("phase") > PHASE.DRAFT ? 1 : 0;

	for (let i = 0; i < g.get("numSeasonsFutureDraftPicks"); i++) {
		const draftYear = g.get("season") + dpOffset + i;

		for (let round = 1; round <= g.get("numDraftRounds"); round++) {
			await idb.cache.draftPicks.put({
				tid: t.tid,
				originalTid: t.tid,
				round,
				pick: 0,
				season: draftYear,
			});
		}

		// Add new draft prospects to draft class
		await draft.genPlayers(draftYear, undefined, g.get("numDraftRounds"));
	}

	await idb.cache.flush(); // Team format used in ManageTemas

	return {
		tid: t.tid,
		abbrev: t.abbrev,
		region: t.region,
		name: t.name,
		imgURL: t.imgURL,
		pop: teamSeason.pop,
		stadiumCapacity: teamSeason.stadiumCapacity,
		colors: t.colors,
	};
};

const allStarDraftAll = async () => {
	const pids = await allStar.draftAll();
	return pids;
};

const allStarDraftOne = async () => {
	const { finalized, pid } = await allStar.draftOne();
	return {
		finalized,
		pid,
	};
};

const allStarDraftUser = async (pid: number) => {
	const finalized = await allStar.draftUser(pid);
	return finalized;
};

const autoSortRoster = async (pos?: string) => {
	await overrides.core.team.rosterAutoSort!(
		g.get("userTid"),
		false,
		typeof pos === "string" ? pos : undefined,
	);
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const beforeViewLeague = async (
	newLid: number,
	loadedLid: number | undefined,
	conditions: Conditions,
) => {
	return beforeView.league(newLid, loadedLid, conditions);
};

const beforeViewNonLeague = async (conditions: Conditions) => {
	return beforeView.nonLeague(conditions);
};

const cancelContractNegotiation = async (pid: number) => {
	return contractNegotiation.cancel(pid);
};

const checkParticipationAchievement = async (
	force: boolean,
	conditions: Conditions,
) => {
	if (force) {
		await achievement.add(["participation"], conditions);
	} else {
		const achievements = await achievement.getAll();
		const participationAchievement = achievements.find(
			({ slug }) => slug === "participation",
		);

		if (participationAchievement && participationAchievement.count === 0) {
			await achievement.add(["participation"], conditions);
		}
	}
};

const clearWatchList = async () => {
	const pids = new Set();
	const players = await idb.cache.players.getAll();

	for (const p of players) {
		if (p.watch && typeof p.watch !== "function") {
			p.watch = false;
			await idb.cache.players.put(p);
		}

		pids.add(p.pid);
	}

	// For watched players not in cache, mark as unwatched an add to cache
	const promises: Promise<any>[] = [];

	await iterate(
		idb.league.transaction("players").store,
		undefined,
		undefined,
		p => {
			if (p.watch && typeof p.watch !== "function" && !pids.has(p.pid)) {
				p.watch = false;
				promises.push(idb.cache.players.add(p)); // Can't await here because of Firefox IndexedDB issues
			}
		},
	);

	await Promise.all(promises);
	await toUI("realtimeUpdate", [["playerMovement", "watchList"]]);
};

const countNegotiations = async () => {
	const negotiations = await idb.cache.negotiations.getAll();
	return negotiations.length;
};

const createLeague = async (
	name: string,
	tid: number,
	leagueFile: object | undefined,
	startingSeason: number,
	randomizeRosters: boolean,
	difficulty: number,
	importLid: number | undefined | null,
	conditions: Conditions,
): Promise<number> => {
	return league.create(
		name,
		tid,
		leagueFile,
		startingSeason,
		randomizeRosters,
		difficulty,
		importLid,
		conditions,
	);
};

const deleteOldData = async (options: {
	boxScores: boolean;
	teamStats: boolean;
	teamHistory: boolean;
	retiredPlayersUnnotable: boolean;
	retiredPlayers: boolean;
	playerStatsUnnotable: boolean;
	playerStats: boolean;
}) => {
	const transaction = idb.league.transaction(
		[
			"allStars",
			"draftLotteryResults",
			"games",
			"teams",
			"teamSeasons",
			"teamStats",
			"players",
		],
		"readwrite",
	);

	if (options.boxScores) {
		transaction.objectStore("games").clear();
	}

	if (options.teamHistory) {
		await iterate(
			transaction.objectStore("teamSeasons"),
			undefined,
			undefined,
			teamSeason => {
				if (teamSeason.season < g.get("season")) {
					transaction.objectStore("teamSeasons").delete(teamSeason.rid);
				}
			},
		);

		transaction.objectStore("draftLotteryResults").clear();

		await iterate(
			transaction.objectStore("allStars"),
			undefined,
			undefined,
			allStars => {
				if (allStars.season < g.get("season")) {
					transaction.objectStore("allStars").delete(allStars.season);
				}
			},
		);
	}

	if (options.teamStats) {
		await iterate(
			transaction.objectStore("teamStats"),
			undefined,
			undefined,
			teamStats => {
				if (teamStats.season < g.get("season")) {
					transaction.objectStore("teamStats").delete(teamStats.rid);
				}
			},
		);
	}

	if (options.retiredPlayers) {
		await iterate(
			transaction.objectStore("players").index("tid"),
			PLAYER.RETIRED,
			undefined,
			p => {
				transaction.objectStore("players").delete(p.pid);
			},
		);
	} else if (options.retiredPlayersUnnotable) {
		await iterate(
			transaction.objectStore("players").index("tid"),
			PLAYER.RETIRED,
			undefined,
			p => {
				if (p.awards.length === 0 && !p.statsTids.includes(g.get("userTid"))) {
					transaction.objectStore("players").delete(p.pid);
				}
			},
		);
	}

	if (options.playerStats) {
		await iterate(
			transaction.objectStore("players"),
			undefined,
			undefined,
			p => {
				let updated = false;
				if (p.ratings.length > 0) {
					updated = true;
					p.ratings = [p.ratings[p.ratings.length - 1]];
				}
				if (p.stats.length > 0) {
					updated = true;
					p.stats = [p.stats[p.stats.length - 1]];
				}

				if (updated) {
					return p;
				}
			},
		);
	} else if (options.playerStatsUnnotable) {
		await iterate(
			transaction.objectStore("players"),
			undefined,
			undefined,
			p => {
				if (p.awards.length === 0 && !p.statsTids.includes(g.get("userTid"))) {
					let updated = false;
					if (p.ratings.length > 0) {
						p.ratings = [p.ratings[p.ratings.length - 1]];
						updated = true;
					}

					if (p.stats.length > 0) {
						p.stats = [p.stats[p.stats.length - 1]];
						updated = true;
					}

					if (updated) {
						return p;
					}
				}
			},
		);
	}

	await transaction.done;

	// Without this, cached values will still exist
	await idb.cache.fill();
};

const draftLottery = async () => {
	const draftLotteryResult = await draft.genOrderNBA();
	return draftLotteryResult;
};

const draftUser = async (pid: number, conditions: Conditions) => {
	if (lock.get("drafting")) {
		return;
	}

	const draftPicks = await draft.getOrder();
	const dp = draftPicks[0];

	if (dp && g.get("userTids").includes(dp.tid)) {
		draftPicks.shift();
		await draft.selectPlayer(dp, pid);
		await draft.afterPicks(draftPicks.length === 0, conditions);
	} else {
		throw new Error("User trying to draft out of turn.");
	}
};

// exportPlayerAveragesCsv(2015) - just 2015 stats
// exportPlayerAveragesCsv("all") - all stats
const exportPlayerAveragesCsv = async (season: number | "all") => {
	let players: Player<MinimalPlayerRatings>[];

	if (g.get("season") === season && g.get("phase") <= PHASE.PLAYOFFS) {
		players = await idb.cache.players.indexGetAll("playersByTid", [
			PLAYER.FREE_AGENT,
			Infinity,
		]);
	} else if (season === "all") {
		players = await idb.getCopies.players({
			activeAndRetired: true,
		});
	} else {
		players = await idb.getCopies.players({
			activeSeason: season,
		});
	}

	// Array of seasons in stats, either just one or all of them
	let seasons;

	if (season === "all") {
		seasons = Array.from(
			new Set(flatten(players.map(p => p.ratings)).map(pr => pr.season)),
		);
	} else {
		seasons = [season];
	}

	const ratings = overrides.common.constants.RATINGS;
	let stats: string[] = [];

	for (const table of Object.values(
		overrides.common.constants.PLAYER_STATS_TABLES,
	)) {
		stats.push(...table.stats);
	}

	stats = Array.from(new Set(stats));
	const columns = [
		"pid",
		"Name",
		"Pos",
		"DraftPick",
		"Age",
		"Salary",
		"Team",
		"Season",
		...getCols(...stats.map(stat => `stat:${stat}`)).map(col => col.title),
		"Ovr",
		"Pot",
		...getCols(...ratings.map(rating => `rating:${rating}`)).map(
			col => col.title,
		),
	];
	const rows: any[] = [];

	for (const s of seasons) {
		console.log(s, new Date());
		const players2 = await idb.getCopies.playersPlus(players, {
			attrs: ["pid", "name", "age", "draft", "salary"],
			ratings: ["pos", "ovr", "pot", ...ratings],
			stats: ["abbrev", ...stats],
			season: s,
		});

		for (const p of players2) {
			rows.push([
				p.pid,
				p.name,
				p.ratings.pos,
				p.draft.round > 0 && p.draft.pick > 0
					? (p.draft.round - 1) * 30 + p.draft.pick
					: "",
				p.age,
				p.salary,
				p.stats.abbrev,
				s,
				...stats.map(stat => p.stats[stat]),
				p.ratings.ovr,
				p.ratings.pot,
				...ratings.map(rating => p.ratings[rating]),
			]);
		}
	}

	return csvFormatRows([columns, ...rows]);
}; // exportPlayerGamesCsv(2015) - just 2015 games
// exportPlayerGamesCsv("all") - all games

const exportPlayerGamesCsv = async (season: number | "all") => {
	let games;

	if (season === "all") {
		games = await idb.getCopies.games();
	} else {
		games = await idb.getCopies.games({
			season,
		});
	}

	const columns = [
		"gid",
		"pid",
		"Name",
		"Pos",
		"Team",
		"Opp",
		"Score",
		"WL",
		"Season",
		"Playoffs",
		"MP",
		"FGM",
		"FGA",
		"FG%",
		"3PM",
		"3PA",
		"3P%",
		"FTM",
		"FTA",
		"FT%",
		"ORB",
		"DRB",
		"TRB",
		"AST",
		"TO",
		"STL",
		"BLK",
		"BA",
		"PF",
		"PTS",
		"+/-",
	];
	const rows: any[] = [];
	const teams = games.map(gm => gm.teams);
	const seasons = games.map(gm => gm.season);

	for (let i = 0; i < teams.length; i++) {
		for (let j = 0; j < 2; j++) {
			const t = teams[i][j];
			const t2 = teams[i][j === 0 ? 1 : 0];

			for (const p of t.players) {
				rows.push([
					games[i].gid,
					p.pid,
					p.name,
					p.pos,
					g.get("teamAbbrevsCache")[t.tid],
					g.get("teamAbbrevsCache")[t2.tid],
					`${t.pts}-${t2.pts}`,
					t.pts > t2.pts ? "W" : "L",
					seasons[i],
					games[i].playoffs,
					p.min,
					p.fg,
					p.fga,
					p.fgp,
					p.tp,
					p.tpa,
					p.tpp,
					p.ft,
					p.fta,
					p.ftp,
					p.orb,
					p.drb,
					p.drb + p.orb,
					p.ast,
					p.tov,
					p.stl,
					p.blk,
					p.ba,
					p.pf,
					p.pts,
					p.pm,
				]);
			}
		}
	}

	return csvFormatRows([columns, ...rows]);
};

const genFilename = (data: any) => {
	const leagueName =
		data.meta !== undefined ? data.meta.name : `League ${g.get("lid")}`;
	let filename = `${
		process.env.SPORT === "basketball" ? "B" : "F"
	}BGM_${leagueName.replace(/[^a-z0-9]/gi, "_")}_${g.get(
		"season",
	)}_${PHASE_TEXT[g.get("phase")].replace(/[^a-z0-9]/gi, "_")}`;

	if (g.get("phase") === PHASE.REGULAR_SEASON && data.hasOwnProperty("teams")) {
		const season =
			data.teams[g.get("userTid")].seasons[
				data.teams[g.get("userTid")].seasons.length - 1
			];
		filename += `_${season.won}-${season.lost}`;
	}

	if (
		g.get("phase") === PHASE.PLAYOFFS &&
		data.hasOwnProperty("playoffSeries")
	) {
		// Most recent series info
		const playoffSeries = data.playoffSeries[data.playoffSeries.length - 1];
		const rnd = playoffSeries.currentRound;
		filename += `_Round_${playoffSeries.currentRound + 1}`; // Find the latest playoff series with the user's team in it

		for (const series of playoffSeries.series[rnd]) {
			if (series.home.tid === g.get("userTid")) {
				if (series.away) {
					filename += `_${series.home.won}-${series.away.won}`;
				} else {
					filename += "_bye";
				}
			} else if (series.away && series.away.tid === g.get("userTid")) {
				filename += `_${series.away.won}-${series.home.won}`;
			}
		}
	}

	return `${filename}.json`;
};

const exportLeague = async (stores: string[], compressed: boolean) => {
	const data = await league.exportLeague(stores);
	const filename = genFilename(data);
	const json = JSON.stringify(data, null, compressed ? undefined : 2);
	return {
		filename,
		json,
	};
};

const exportDraftClass = async (season: number) => {
	const data = await league.exportLeague(["players"], {
		meta: false,
		filter: {
			players: p => p.draft.year === season,
		},
	});
	data.startingSeason = season;
	const filename = `BBGM_draft_class_${g.get("leagueName")}_${season}.json`;
	return {
		filename,
		json: JSON.stringify(data),
	};
};

const generateFace = () => {
	return face.generate();
};

const getLeagueName = async () => {
	const l = await idb.meta.get("leagues", g.get("lid"));
	if (l) {
		return l.name;
	}

	return "Unknown league";
};

const getLocal = async (name: keyof Local) => {
	return local[name];
};

const getTradingBlockOffers = async (pids: number[], dpids: number[]) => {
	const getOffers = async (userPids: number[], userDpids: number[]) => {
		// Pick 10 random teams to try (or all teams, if g.get("numTeams") < 10)
		const tids = range(g.get("numTeams"));
		random.shuffle(tids);
		tids.splice(10);
		const estValues = await trade.getPickValues();
		const offers: TradeTeam[] = [];

		for (const tid of tids) {
			const teams: TradeTeams = [
				{
					tid: g.get("userTid"),
					pids: userPids,
					pidsExcluded: [],
					dpids: userDpids,
					dpidsExcluded: [],
				},
				{
					tid,
					pids: [],
					pidsExcluded: [],
					dpids: [],
					dpidsExcluded: [],
				},
			];

			if (tid !== g.get("userTid")) {
				const teams2 = await trade.makeItWork(teams, true, estValues);

				if (teams2) {
					const summary = await trade.summary(teams2);
					teams2[1].warning = summary.warning;
					offers.push(teams2[1]);
				}
			}
		}

		return offers;
	};

	const augmentOffers = async (offers: TradeTeam[]) => {
		if (offers.length === 0) {
			return [];
		}

		const teams = await idb.getCopies.teamsPlus({
			attrs: ["abbrev", "region", "name", "strategy"],
			seasonAttrs: ["won", "lost", "tied"],
			season: g.get("season"),
		});
		const stats =
			process.env.SPORT === "basketball"
				? ["min", "pts", "trb", "ast", "per"]
				: ["gp", "keyStats", "av"]; // Take the pids and dpids in each offer and get the info needed to display the offer

		return Promise.all(
			offers.map(async offer => {
				const tid = offer.tid;
				let playersAll = await idb.cache.players.indexGetAll(
					"playersByTid",
					tid,
				);
				playersAll = playersAll.filter(p => offer.pids.includes(p.pid));
				const players = await idb.getCopies.playersPlus(playersAll, {
					attrs: ["pid", "name", "age", "contract", "injury", "watch"],
					ratings: ["ovr", "pot", "skills", "pos"],
					stats,
					season: g.get("season"),
					tid,
					showNoStats: true,
					showRookies: true,
					fuzz: true,
				});
				let picks = await idb.getCopies.draftPicks({
					tid,
				});
				picks = picks.filter(dp => offer.dpids.includes(dp.dpid));

				const picks2 = picks.map(dp => {
					return {
						...dp,
						desc: helpers.pickDesc(dp),
					};
				});

				const payroll = await team.getPayroll(tid);
				return {
					tid,
					abbrev: teams[tid].abbrev,
					region: teams[tid].region,
					name: teams[tid].name,
					strategy: teams[tid].strategy,
					won: teams[tid].seasonAttrs.won,
					lost: teams[tid].seasonAttrs.lost,
					tied: teams[tid].seasonAttrs.tied,
					pids: offer.pids,
					dpids: offer.dpids,
					warning: offer.warning,
					payroll,
					picks: picks2,
					players,
				};
			}),
		);
	};

	const offers = await getOffers(pids, dpids);
	return augmentOffers(offers);
};

const getVersionWorker = async () => {
	return "REV_GOES_HERE";
};

const handleUploadedDraftClass = async (
	uploadedFile: any,
	draftYear: number,
) => {
	// Find season from uploaded file, for age adjusting
	let uploadedSeason: number | undefined;

	if (uploadedFile.hasOwnProperty("gameAttributes")) {
		for (let i = 0; i < uploadedFile.gameAttributes.length; i++) {
			if (uploadedFile.gameAttributes[i].key === "season") {
				uploadedSeason = uploadedFile.gameAttributes[i].value;
				break;
			}
		}
	}

	if (uploadedFile.hasOwnProperty("startingSeason")) {
		uploadedSeason = uploadedFile.startingSeason;
	}

	// Get all players from uploaded files
	let players: any[] = uploadedFile.players; // Filter out any that are not draft prospects

	players = players.filter(p => p.tid === PLAYER.UNDRAFTED); // Handle draft format change in version 33, where PLAYER.UNDRAFTED has multiple draft classes

	if (uploadedFile.version !== undefined && uploadedFile.version >= 33) {
		let filtered = players.filter(
			p =>
				p.draft === undefined ||
				p.draft.year === undefined ||
				p.draft.year === uploadedSeason,
		);

		if (filtered.length === 0) {
			// Try the next season, in case draft already happened
			filtered = players.filter(
				p =>
					p.draft === undefined ||
					p.draft.year === undefined ||
					(uploadedSeason !== undefined && p.draft.year === uploadedSeason + 1),
			);
		}

		players = filtered;
	}

	// Get scouting rank, which is used in a couple places below
	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[
			[g.get("userTid"), g.get("season") - 2],
			[g.get("userTid"), g.get("season")],
		],
	);
	const scoutingRank = finances.getRankLastThree(
		teamSeasons,
		"expenses",
		"scouting",
	);

	// Delete old players from draft class
	const oldPlayers = await idb.cache.players.indexGetAll(
		"playersByDraftYearRetiredYear",
		[[draftYear], [draftYear, Infinity]],
	);

	for (const p of oldPlayers) {
		if (p.tid === PLAYER.UNDRAFTED) {
			await idb.cache.players.delete(p.pid);
		}
	}

	// Add new players to database
	await Promise.all(
		players.map(async p => {
			// Adjust age and seasons
			p.ratings[0].season = draftYear;

			if (!p.draft) {
				// For college basketball imports
				p.draft = {
					round: 0,
					pick: 0,
					tid: -1,
					originalTid: -1,
					year: draftYear,
					pot: 0,
					ovr: 0,
					skills: [],
				};
				p.born.year = draftYear - 19;
			} else if (uploadedSeason !== undefined) {
				p.born.year = draftYear - (uploadedSeason - p.born.year);
			}

			// Make sure player object is fully defined
			p = player.augmentPartialPlayer(p, scoutingRank, uploadedFile.version);
			p.tid = PLAYER.UNDRAFTED;
			p.draft.year = draftYear;
			p.ratings[p.ratings.length - 1].season = draftYear;

			if (p.hasOwnProperty("pid")) {
				delete p.pid;
			}

			await idb.cache.players.add(p);
		}),
	);

	// "Top off" the draft class if <70 players imported
	const baseNumPlayers = Math.round(
		(g.get("numDraftRounds") * g.get("numTeams") * 7) / 6,
	); // 70 for basketball 2 round draft

	if (players.length < baseNumPlayers) {
		await draft.genPlayers(
			draftYear,
			scoutingRank,
			baseNumPlayers - players.length,
		);
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const init = async (inputEnv: Env, conditions: Conditions) => {
	Object.assign(env, inputEnv); // Kind of hacky, only run this for the first host tab

	if (idb.meta === undefined) {
		checkNaNs();
		idb.meta = await connectMeta();

		// Account and changes checks can be async
		(async () => {
			await checkChanges(conditions);
			await checkAccount(conditions);
			await toUI("initAds", [local.goldUntil], conditions);

			const options = (((await idb.meta.get("attributes", "options")) ||
				{}) as unknown) as Options;
			await toUI("updateLocal", [{ units: options.units }]);
		})();
	} else {
		// Even if it's not the first host tab, show ads (still async). Why
		// setTimeout? Cause horrible race condition with actually rendering the
		// ad divs. Need to move them more fully into React to solve this.
		setTimeout(() => {
			toUI("initAds", [local.goldUntil], conditions);
		}, 0);
	}
};

const lockSet = async (name: LockName, value: boolean) => {
	lock.set(name, value);
};

const ratingsStatsPopoverInfo = async (pid: number) => {
	const blankObj = {
		name: undefined,
		ratings: undefined,
		stats: undefined,
	};

	if (Number.isNaN(pid) || typeof pid !== "number") {
		return blankObj;
	}

	const p = await idb.getCopy.players({
		pid,
	});

	if (!p) {
		return blankObj;
	}

	// For draft prospects, show their draft season, otherwise they will be skipped due to not having ratings in g.get("season")
	const season =
		p.draft.year > g.get("season") ? p.draft.year : g.get("season");
	const stats =
		process.env.SPORT === "basketball"
			? ["pts", "trb", "ast", "blk", "stl", "tov", "min", "per", "ewa"]
			: ["keyStats"];
	return idb.getCopy.playersPlus(p, {
		attrs: ["name"],
		ratings: ["pos", "ovr", "pot", ...overrides.common.constants.RATINGS],
		stats,
		season,
		showNoStats: true,
		showRetired: true,
		oldStats: true,
		fuzz: true,
	});
};

// Why does this exist, just to send it back to the UI? So an action in one tab will trigger and update in all tabs!
const realtimeUpdate = async (updateEvents: UpdateEvents) => {
	await toUI("realtimeUpdate", [updateEvents]);
};

const releasePlayer = async (pid: number, justDrafted: boolean) => {
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		g.get("userTid"),
	);

	if (players.length <= 5) {
		return "You must keep at least 5 players on your roster.";
	}

	const p = await idb.cache.players.get(pid); // Don't let the user update CPU-controlled rosters

	if (p.tid !== g.get("userTid")) {
		return "You aren't allowed to do this.";
	}

	await player.release(p, justDrafted);
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const removeLastTeam = async (): Promise<void> => {
	const tid = g.get("numTeams") - 1;
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);
	const baseMoods = await player.genBaseMoods();

	for (const p of players) {
		player.addToFreeAgents(p, g.get("phase"), baseMoods);
		await idb.cache.players.put(p);
	}

	// Delete draft picks, and return traded ones to original owner
	const draftPicks = await idb.cache.draftPicks.getAll();

	for (const dp of draftPicks) {
		if (dp.originalTid === tid) {
			await idb.cache.draftPicks.delete(dp.dpid);
		} else if (dp.tid === tid) {
			dp.tid = dp.originalTid;
			await idb.cache.draftPicks.put(dp);
		}
	}

	const teamSeasons = await idb.cache.teamSeasons.indexGetAll(
		"teamSeasonsByTidSeason",
		[[tid], [tid, "Z"]],
	);

	for (const teamSeason of teamSeasons) {
		await idb.cache.teamSeasons.delete(teamSeason.rid);
	}

	const teamStats = [
		...(await idb.cache.teamStats.indexGetAll("teamStatsByPlayoffsTid", [
			[false, tid],
			[false, tid],
		])),
		...(await idb.cache.teamStats.indexGetAll("teamStatsByPlayoffsTid", [
			[true, tid],
			[true, tid],
		])),
	];

	for (const teamStat of teamStats) {
		await idb.cache.teamStats.delete(teamStat.rid);
	}

	await idb.cache.teams.delete(tid);
	const updatedGameAttributes: any = {
		numTeams: g.get("numTeams") - 1,
		teamAbbrevsCache: g
			.get("teamAbbrevsCache")
			.slice(0, g.get("teamAbbrevsCache").length - 1),
		teamRegionsCache: g
			.get("teamRegionsCache")
			.slice(0, g.get("teamRegionsCache").length - 1),
		teamNamesCache: g
			.get("teamNamesCache")
			.slice(0, g.get("teamNamesCache").length - 1),
		teamImgURLsCache: g
			.get("teamImgURLsCache")
			.slice(0, g.get("teamImgURLsCache").length - 1),
		userTids: g.get("userTids").filter(userTid => userTid !== tid),
	};

	if (g.get("userTid") === tid && tid > 0) {
		updatedGameAttributes.userTid = tid - 1;

		if (!updatedGameAttributes.userTids.includes(tid - 1)) {
			updatedGameAttributes.userTids.push(tid - 1);
		}
	}

	await league.setGameAttributes(updatedGameAttributes);
	await idb.cache.flush();
};

const removeLeague = async (lid: number) => {
	await league.remove(lid);
	await toUI("realtimeUpdate", [["leagues"]]);
};

const reorderDepthDrag = async (pos: string, sortedPids: number[]) => {
	const t = await idb.cache.teams.get(g.get("userTid"));
	const depth = t.depth;

	if (depth === undefined) {
		throw new Error("Missing depth");
	}

	if (depth.hasOwnProperty(pos)) {
		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-ignore
		depth[pos] = sortedPids;
		await idb.cache.teams.put(t);
		await toUI("realtimeUpdate", [["playerMovement"]]);
	}
};

const reorderRosterDrag = async (sortedPids: number[]) => {
	await Promise.all(
		sortedPids.map(async (pid, rosterOrder) => {
			const p = await idb.cache.players.get(pid);

			if (p.rosterOrder !== rosterOrder) {
				p.rosterOrder = rosterOrder;
				await idb.cache.players.put(p);
			}
		}),
	);
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const resetPlayingTime = async (tid: number) => {
	const players = await idb.cache.players.indexGetAll("playersByTid", tid);

	for (const p of players) {
		p.ptModifier = 1;
		await idb.cache.players.put(p);
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const runBefore = async (
	viewId: string,
	params: any,
	ctxBBGM: any,
	updateEvents: UpdateEvents,
	prevData: any,
	conditions: Conditions,
): Promise<void | {
	[key: string]: any;
}> => {
	// Special case for errors, so that the condition right below (when league is loading) does not cause no update
	if (viewId === "error") {
		return {};
	}

	if (typeof g.get("lid") === "number" && !local.leagueLoaded) {
		return;
	}

	let inputs;
	if (processInputs.hasOwnProperty(viewId)) {
		// https://github.com/microsoft/TypeScript/issues/21732
		// @ts-ignore
		inputs = processInputs[viewId](params, ctxBBGM);
	}
	if (inputs === undefined) {
		// Return empty object rather than undefined
		inputs = {};
	}

	if (typeof inputs.redirectUrl === "string") {
		// Short circuit from processInputs alone
		return {
			redirectUrl: inputs.redirectUrl,
		};
	}

	// https://github.com/microsoft/TypeScript/issues/21732
	// @ts-ignore
	const view = views[viewId] ? views[viewId] : overrides.views[viewId];

	if (view) {
		const data = await view(inputs, updateEvents, prevData, conditions);
		return data === undefined ? {} : data;
	}

	return {};
};

const sign = async (
	pid: number,
	amount: number,
	exp: number,
): Promise<string | undefined | null> => {
	// Kind of hacky that a negotiation is needed...
	const negotiation = await idb.cache.negotiations.get(pid);

	if (!negotiation) {
		const errorMsg = await contractNegotiation.create(pid, false);

		if (errorMsg !== undefined && errorMsg) {
			return errorMsg;
		}
	}

	const errorMsg = await contractNegotiation.accept(pid, amount, exp);

	if (errorMsg !== undefined && errorMsg) {
		return errorMsg;
	}

	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const startFantasyDraft = async (tids: number[], conditions: Conditions) => {
	await phase.newPhase(PHASE.FANTASY_DRAFT, conditions, tids);
};

const switchTeam = async (tid: number) => {
	await updateStatus("Idle");
	updatePlayMenu();
	await league.setGameAttributes({
		gameOver: false,
		userTid: tid,
		userTids: [tid],
		gracePeriodEnd: g.get("season") + 3, // +3 is the same as +2 when staring a new league, since this happens at the end of a season
	});
	league.updateMetaNameRegion(
		g.get("teamNamesCache")[g.get("userTid")],
		g.get("teamRegionsCache")[g.get("userTid")],
	);
	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsByTidSeason",
		[tid, g.get("season")],
	);
	teamSeason.ownerMood = {
		money: 0,
		playoffs: 0,
		wins: 0,
	};
	await idb.cache.teamSeasons.put(teamSeason);
	await toUI("realtimeUpdate", [["leagues"]]);
};

const updateBudget = async (budgetAmounts: {
	coaching: number;
	facilities: number;
	health: number;
	scouting: number;
	ticketPrice: number;
}) => {
	const t = await idb.cache.teams.get(g.get("userTid"));

	for (const key of helpers.keys(budgetAmounts)) {
		// Check for NaN before updating
		if (budgetAmounts[key] === budgetAmounts[key]) {
			t.budget[key].amount = budgetAmounts[key];
		}
	}

	await idb.cache.teams.put(t);
	await finances.updateRanks(["budget"]);
	await toUI("realtimeUpdate", [["teamFinances"]]);
};

const updateGameAttributes = async (gameAttributes: GameAttributesLeague) => {
	if (
		gameAttributes.numSeasonsFutureDraftPicks <
		g.get("numSeasonsFutureDraftPicks")
	) {
		// This season and the next N-1 seasons
		let maxSeason =
			g.get("season") + gameAttributes.numSeasonsFutureDraftPicks - 1;

		if (g.get("phase") >= PHASE.AFTER_DRAFT) {
			// ...and one more season, since the draft is over
			maxSeason += 1;
		}

		// Delete draft picks beyond new numSeasonsFutureDraftPicks
		const draftPicks = await idb.cache.draftPicks.getAll();

		for (const dp of draftPicks) {
			if (dp.season !== "fantasy" && dp.season > maxSeason) {
				await idb.cache.draftPicks.delete(dp.dpid);
			}
		}
	} else if (
		gameAttributes.numSeasonsFutureDraftPicks >
		g.get("numSeasonsFutureDraftPicks")
	) {
		// This season and the next N-1 seasons
		let oldMaxSeason =
			g.get("season") + g.get("numSeasonsFutureDraftPicks") - 1;

		if (g.get("phase") >= PHASE.AFTER_DRAFT) {
			// ...and one more season, since the draft is over
			oldMaxSeason += 1;
		}

		const numSeasonsToAdd =
			gameAttributes.numSeasonsFutureDraftPicks -
			g.get("numSeasonsFutureDraftPicks");

		for (let i = 1; i <= numSeasonsToAdd; i++) {
			const season = oldMaxSeason + i;
			await draft.genPicks(season);
		}
	}

	await league.setGameAttributes(gameAttributes);
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const updateLeague = async (lid: number, obj: any) => {
	const l = await idb.meta.get("leagues", lid);
	if (!l) {
		throw new Error(`No league with lid ${lid} found`);
	}
	Object.assign(l, obj);
	await idb.meta.put("leagues", l);
	await toUI("realtimeUpdate", [["leagues"]]);
};

const updateMultiTeamMode = async (gameAttributes: {
	userTids: number[];
	userTid?: number;
}) => {
	await league.setGameAttributes(gameAttributes);

	if (gameAttributes.userTids.length === 1) {
		league.updateMetaNameRegion(
			g.get("teamNamesCache")[gameAttributes.userTids[0]],
			g.get("teamRegionsCache")[gameAttributes.userTids[0]],
		);
	} else {
		league.updateMetaNameRegion("Multi Team Mode", "");
	}

	await toUI("realtimeUpdate", [["g.userTids"]]);
};

const updateOptions = async (options: Options) => {
	await idb.meta.put("attributes", options, "options");
	await toUI("updateLocal", [{ units: options.units }]);
	await toUI("realtimeUpdate", [["options"]]);
};

const updatePlayerWatch = async (pid: number, watch: boolean) => {
	const cachedPlayer = await idb.cache.players.get(pid);

	if (cachedPlayer) {
		cachedPlayer.watch = watch;
		await idb.cache.players.put(cachedPlayer);
	} else {
		const p = await idb.league.get("players", pid);
		if (p) {
			p.watch = watch;
			await idb.cache.players.add(p);
		}
	}

	await toUI("realtimeUpdate", [["playerMovement", "watchList"]]);
};

const updatePlayingTime = async (pid: number, ptModifier: number) => {
	const p = await idb.cache.players.get(pid);
	p.ptModifier = ptModifier;
	await idb.cache.players.put(p);
	await toUI("realtimeUpdate", [["playerMovement"]]);
};

const updateTeamInfo = async (
	newTeams: {
		cid?: number;
		did?: number;
		region: string;
		name: string;
		abbrev: string;
		imgURL?: string;
		pop: number | string;
		stadiumCapacity: number | string;
		colors: [string, string, string];
	}[],
) => {
	let userName;
	let userRegion;
	const teams = await idb.cache.teams.getAll();

	for (const t of teams) {
		const { cid, did } = newTeams[t.tid];

		if (cid !== undefined) {
			t.cid = cid;
		}

		if (did !== undefined) {
			t.did = did;
		}

		t.region = newTeams[t.tid].region;
		t.name = newTeams[t.tid].name;
		t.abbrev = newTeams[t.tid].abbrev;

		if (newTeams[t.tid].hasOwnProperty("imgURL")) {
			t.imgURL = newTeams[t.tid].imgURL;
		}

		t.colors = newTeams[t.tid].colors;
		await idb.cache.teams.put(t);

		if (t.tid === g.get("userTid")) {
			userName = t.name;
			userRegion = t.region;
		}

		const teamSeason = await idb.cache.teamSeasons.indexGet(
			"teamSeasonsByTidSeason",
			[t.tid, g.get("season")],
		);
		teamSeason.pop = parseFloat(newTeams[t.tid].pop as string);
		teamSeason.stadiumCapacity = parseInt(
			newTeams[t.tid].stadiumCapacity as string,
			10,
		);

		if (Number.isNaN(teamSeason.pop)) {
			throw new Error("Invalid pop");
		}

		if (Number.isNaN(teamSeason.stadiumCapacity)) {
			throw new Error("Invalid stadiumCapacity");
		}

		await idb.cache.teamSeasons.put(teamSeason);
	}

	if (userName !== undefined && userRegion !== undefined) {
		await league.updateMetaNameRegion(userName, userRegion);
	}
	await league.setGameAttributes({
		teamAbbrevsCache: newTeams.map(t => t.abbrev),
		teamRegionsCache: newTeams.map(t => t.region),
		teamNamesCache: newTeams.map(t => t.name),
		teamImgURLsCache: newTeams.map(t => t.imgURL),
	});
};

const upsertCustomizedPlayer = async (
	p: Player | PlayerWithoutKey,
	originalTid: number,
	season: number,
	updatedRatingsOrAge: boolean,
): Promise<number> => {
	const r = p.ratings.length - 1; // Fix draft and ratings season

	if (p.tid === PLAYER.UNDRAFTED) {
		if (p.draft.year < season) {
			p.draft.year = season;
		}

		// Once a new draft class is generated, if the next season hasn't started, need to bump up year numbers
		if (p.draft.year === season && g.get("phase") >= PHASE.RESIGN_PLAYERS) {
			p.draft.year += 1;
		}

		p.ratings[r].season = p.draft.year;
	} else {
		// If a player was a draft prospect (or some other weird shit happened), ratings season might be wrong
		p.ratings[r].season = g.get("season");
	}

	// If player was retired, add ratings (but don't develop, because that would change ratings)
	if (originalTid === PLAYER.RETIRED) {
		if (g.get("season") - p.ratings[r].season > 0) {
			player.addRatingsRow(p, 15);
		}
	}

	// If we are *creating* a player who is not a draft prospect, make sure he won't show up in the draft this year
	if (p.tid !== PLAYER.UNDRAFTED && g.get("phase") < PHASE.FREE_AGENCY) {
		// This makes sure it's only for created players, not edited players
		if (!p.hasOwnProperty("pid")) {
			p.draft.year = g.get("season") - 1;
		}
	}

	// Similarly, if we are editing a draft prospect and moving him to a team, make his draft year in the past
	if (
		p.tid !== PLAYER.UNDRAFTED &&
		originalTid === PLAYER.UNDRAFTED &&
		g.get("phase") < PHASE.FREE_AGENCY
	) {
		p.draft.year = g.get("season") - 1;
	}

	// Recalculate player ovr, pot, and values if necessary
	const selectedPos = p.ratings[r].pos;

	if (updatedRatingsOrAge || !p.hasOwnProperty("pid")) {
		player.develop(p, 0);
		player.updateValues(p);
	}

	// In case that develop call reset position, re-apply it here
	p.ratings[r].pos = selectedPos;

	if (process.env.SPORT === "football") {
		if (
			p.ratings[r].ovrs &&
			p.ratings[r].ovrs.hasOwnProperty(selectedPos) &&
			p.ratings[r].pots &&
			p.ratings[r].pots.hasOwnProperty(selectedPos)
		) {
			p.ratings[r].ovr = p.ratings[r].ovrs[selectedPos];
			p.ratings[r].pot = p.ratings[r].pots[selectedPos];
		}
	}

	// Add regular season or playoffs stat row, if necessary
	if (p.tid >= 0 && p.tid !== originalTid && g.get("phase") <= PHASE.PLAYOFFS) {
		// If it is the playoffs, this is only necessary if p.tid actually made the playoffs, but causes only cosmetic harm otherwise.
		player.addStatsRow(p, g.get("phase") === PHASE.PLAYOFFS);
	}

	// Fill in player names for relatives
	const relatives: Relative[] = [];

	for (const rel of p.relatives) {
		const p2 = await idb.getCopy.players({
			pid: rel.pid,
		});

		if (p2) {
			rel.name = `${p2.firstName} ${p2.lastName}`;
		}

		if (rel.name !== "") {
			// This will keep names of deleted players too, just not blank entries
			relatives.push(rel);
		}
	}

	p.relatives = relatives; // Save to database, adding pid if it doesn't already exist

	await idb.cache.players.put(p);

	// @ts-ignore
	if (typeof p.pid !== "number") {
		throw new Error("Unknown pid");
	}

	// @ts-ignore
	return p.pid;
};

const clearTrade = async () => {
	await trade.clear();
	await toUI("realtimeUpdate", []);
};

const createTrade = async (
	teams: [
		{
			tid: number;
			pids: number[];
			pidsExcluded: [];
			dpids: number[];
			dpidsExcluded: [];
		},
		{
			tid: number;
			pids: number[];
			pidsExcluded: [];
			dpids: number[];
			dpidsExcluded: [];
		},
	],
) => {
	await trade.create(teams);
	await toUI("realtimeUpdate", []);
};

const proposeTrade = async (
	forceTrade: boolean,
): Promise<[boolean, string | undefined | null]> => {
	const output = await trade.propose(forceTrade);
	await toUI("realtimeUpdate", []);
	return output;
};

const tradeCounterOffer = async (): Promise<string> => {
	const message = await trade.makeItWorkTrade();
	await toUI("realtimeUpdate", []);
	return message;
};

const updateTrade = async (teams: TradeTeams) => {
	await trade.updatePlayers(teams);
	await toUI("realtimeUpdate", []);
};

export default {
	actions,
	acceptContractNegotiation,
	addTeam,
	allStarDraftAll,
	allStarDraftOne,
	allStarDraftUser,
	autoSortRoster,
	beforeViewLeague,
	beforeViewNonLeague,
	cancelContractNegotiation,
	checkParticipationAchievement,
	clearTrade,
	clearWatchList,
	countNegotiations,
	createLeague,
	createTrade,
	deleteOldData,
	draftLottery,
	draftUser,
	exportDraftClass,
	exportLeague,
	exportPlayerAveragesCsv,
	exportPlayerGamesCsv,
	generateFace,
	getLeagueName,
	getLocal,
	getTradingBlockOffers,
	getVersionWorker,
	handleUploadedDraftClass,
	init,
	lockSet,
	proposeTrade,
	ratingsStatsPopoverInfo,
	realtimeUpdate,
	releasePlayer,
	removeLastTeam,
	removeLeague,
	reorderDepthDrag,
	reorderRosterDrag,
	resetPlayingTime,
	runBefore,
	sign,
	startFantasyDraft,
	switchTeam,
	tradeCounterOffer,
	updateBudget,
	updateGameAttributes,
	updateLeague,
	updateMultiTeamMode,
	updateOptions,
	updatePlayerWatch,
	updatePlayingTime,
	updateTeamInfo,
	updateTrade,
	upsertCustomizedPlayer,
};
