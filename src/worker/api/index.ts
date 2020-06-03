import { csvFormatRows } from "d3-dsv";
import flatten from "lodash/flatten";
import {
	PHASE,
	PHASE_TEXT,
	PLAYER,
	getCols,
	PLAYER_STATS_TABLES,
	RATINGS,
	applyRealTeamInfo,
} from "../../common";
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
	expansionDraft,
	realRosters,
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
	random,
	updatePlayMenu,
	updateStatus,
	toUI,
	recomputeLocalUITeamOvrs,
	updatePhase,
	logEvent,
} from "../util";
import views from "../views";
import type {
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
	ExpansionDraftSetupTeam,
	RealTeamInfo,
	RealPlayerPhotos,
	GetLeagueOptions,
	TeamSeason,
	TeamSeasonWithoutKey,
} from "../../common/types";
import setGameAttributes from "../core/league/setGameAttributes";
import orderBy from "lodash/orderBy";

const acceptContractNegotiation = async (
	pid: number,
	amount: number,
	exp: number,
): Promise<string | undefined | null> => {
	return contractNegotiation.accept(pid, amount, exp);
};

const addTeam = async (): Promise<{
	tid: number;
	abbrev: string;
	region: string;
	name: string;
	imgURL?: string;
	pop: number;
	stadiumCapacity: number;
	colors: [string, string, string];
}> => {
	const did = g.get("divs")[0].did;

	const t = await team.addNewTeamToExistingLeague({
		did,
		region: "Region",
		name: "Name",
		abbrev: "ZZZ",
		pop: 1,
		imgURL: undefined,
	});

	await idb.cache.flush();

	// Team format used in ManageTemas
	return {
		tid: t.tid,
		abbrev: t.abbrev,
		region: t.region,
		name: t.name,
		imgURL: t.imgURL,
		// @ts-ignore
		pop: t.pop,
		// @ts-ignore
		stadiumCapacity: t.stadiumCapacity,
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

const autoSortRoster = async (
	pos: string | undefined,
	tids: number[] | undefined,
) => {
	const tids2 = tids !== undefined ? tids : [g.get("userTid")];

	for (const tid of tids2) {
		await team.rosterAutoSort(
			tid,
			false,
			typeof pos === "string" ? pos : undefined,
		);
	}
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

const createLeague = async ({
	name,
	tid,
	leagueFileInput,
	shuffleRosters,
	difficulty,
	importLid,
	getLeagueOptions,
	keptKeys,
}: {
	name: string;
	tid: number;
	leagueFileInput: any;
	shuffleRosters: boolean;
	difficulty: number;
	importLid: number | undefined | null;
	getLeagueOptions: GetLeagueOptions | undefined;
	keptKeys: string[];
}): Promise<number> => {
	if (getLeagueOptions) {
		leagueFileInput = await realRosters.getLeague(getLeagueOptions);
	}

	const leagueFile: any = {};
	for (const key of [...keptKeys, "version"]) {
		if (leagueFileInput && leagueFileInput[key]) {
			leagueFile[key] = leagueFileInput[key];
		}
	}

	if (leagueFile.startingSeason === undefined) {
		leagueFile.startingSeason = new Date().getFullYear();
	}

	if (leagueFile.players) {
		const realPlayerPhotos = (await idb.meta.get(
			"attributes",
			"realPlayerPhotos",
		)) as RealPlayerPhotos | undefined;
		if (realPlayerPhotos) {
			for (const p of leagueFile.players) {
				if (p.srID && realPlayerPhotos[p.srID]) {
					p.imgURL = realPlayerPhotos[p.srID];
				}
			}
		}
	}

	const realTeamInfo = (await idb.meta.get("attributes", "realTeamInfo")) as
		| RealTeamInfo
		| undefined;
	if (realTeamInfo) {
		if (leagueFile.teams) {
			for (const t of leagueFile.teams) {
				applyRealTeamInfo(t, realTeamInfo, leagueFile.startingSeason);
			}
		}
		if (leagueFile.scheduledEvents) {
			for (const event of leagueFile.scheduledEvents) {
				if (event.type === "expansionDraft") {
					for (const t of event.info.teams) {
						if (t.srID && realTeamInfo[t.srID]) {
							Object.assign(t, realTeamInfo[t.srID]);
						}
					}
				} else if (event.type === "teamInfo") {
					if (event.info.srID && realTeamInfo[event.info.srID]) {
						Object.assign(event.info, realTeamInfo[event.info.srID]);
					}
				}
			}
		}
	}

	const lid = league.create({
		name,
		tid,
		leagueFile,
		shuffleRosters,
		difficulty,
		importLid,
	});

	return lid;
};

const deleteOldData = async (options: {
	boxScores: boolean;
	events: boolean;
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
			"events",
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

	if (options.events) {
		transaction.objectStore("events").clear();
	}

	await transaction.done;

	// Without this, cached values will still exist
	await idb.cache.fill();
};

const discardUnsavedProgress = async () => {
	const lid = g.get("lid");
	await league.close(true);
	await beforeView.league(lid, undefined);
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

	const ratings = RATINGS;
	let stats: string[] = [];

	for (const table of Object.values(PLAYER_STATS_TABLES)) {
		stats.push(...table.stats);
	}

	// Ugh
	const shotLocationsGetCols = (cols: string[]) => {
		const colNames: string[] = [];
		const overrides = {
			"stat:fgAtRim": "AtRimFG",
			"stat:fgaAtRim": "AtRimFGA",
			"stat:fgpAtRim": "AtRimFGP",
			"stat:fgLowPost": "LowPostFG",
			"stat:fgaLowPost": "LowPostFGA",
			"stat:fgpLowPost": "LowPostFGP",
			"stat:fgMidRange": "MidRangeFG",
			"stat:fgaMidRange": "MidRangeFGA",
			"stat:fgpMidRange": "MidRangeFGP",
		};
		for (const col of cols) {
			// @ts-ignore
			if (overrides[col]) {
				// @ts-ignore
				colNames.push(overrides[col]);
			} else {
				const array = getCols(col);
				colNames.push(array[0].title);
			}
		}

		return colNames;
	};

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
		...shotLocationsGetCols(stats.map(stat => `stat:${stat}`)),
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
};

// exportPlayerGamesCsv(2015) - just 2015 games
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
					g.get("teamInfoCache")[t.tid]?.abbrev,
					g.get("teamInfoCache")[t2.tid]?.abbrev,
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
		filename += `_Round_${playoffSeries.currentRound + 1}`;

		// Find the latest playoff series with the user's team in it
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
	const filename = `${
		process.env.SPORT === "basketball" ? "B" : "F"
	}BGM_draft_class_${g.get("leagueName")}_${season}.json`;
	return {
		filename,
		json: JSON.stringify(data),
	};
};

const generateFace = () => {
	return face.generate();
};

const getLeagueInfo = async (
	options: Parameters<typeof realRosters.getLeagueInfo>[0],
) => {
	return realRosters.getLeagueInfo(options);
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

const getRandomRatings = (age: number, pos: string | undefined) => {
	// 100 tries to find a matching position
	let p: any;
	for (let i = 0; i < 100; i++) {
		p = player.generate(
			PLAYER.UNDRAFTED,
			19,
			g.get("season"),
			false,
			g.get("numActiveTeams") / 2,
		);
		if (p.ratings[0].pos === pos || pos === undefined) {
			break;
		}
	}

	player.develop(p, age - 19);

	const ratings: Record<string, unknown> = {};
	for (const key of RATINGS) {
		ratings[key] = (p.ratings[0] as any)[key];
	}
	if (pos === undefined) {
		ratings.pos = p.ratings[0].pos;
	}
	return {
		hgt: p.hgt,
		ratings,
	};
};

const getTradingBlockOffers = async (pids: number[], dpids: number[]) => {
	const getOffers = async (userPids: number[], userDpids: number[]) => {
		// Pick 10 random teams to try (or all teams, if g.get("numActiveTeams") < 10)
		const teams = await idb.cache.teams.getAll();
		const tids = teams.filter(t => !t.disabled).map(t => t.tid);
		random.shuffle(tids);
		tids.splice(10);
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
				const teams2 = await trade.makeItWork(teams, true);

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
			attrs: ["abbrev", "region", "name", "strategy", "tid"],
			seasonAttrs: ["won", "lost", "tied"],
			season: g.get("season"),
			addDummySeason: true,
			active: true,
		});
		const stats =
			process.env.SPORT === "basketball"
				? ["min", "pts", "trb", "ast", "per"]
				: ["gp", "keyStats", "av"];

		// Take the pids and dpids in each offer and get the info needed to display the offer
		return Promise.all(
			offers.map(async offer => {
				const tid = offer.tid;
				const t = teams.find(t => t.tid === tid);
				if (!t) {
					throw new Error("No team found");
				}

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
					abbrev: t.abbrev,
					region: t.region,
					name: t.name,
					strategy: t.strategy,
					won: t.seasonAttrs.won,
					lost: t.seasonAttrs.lost,
					tied: t.seasonAttrs.tied,
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
	let players: any[] = uploadedFile.players;

	// Filter out any that are not draft prospects
	players = players.filter(p => p.tid === PLAYER.UNDRAFTED);

	// Handle draft format change in version 33, where PLAYER.UNDRAFTED has multiple draft classes
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
			p.draft.year = draftYear;
			p.ratings[p.ratings.length - 1].season = draftYear;
			p = player.augmentPartialPlayer(p, scoutingRank, uploadedFile.version);
			p.tid = PLAYER.UNDRAFTED;

			if (p.hasOwnProperty("pid")) {
				delete p.pid;
			}

			await idb.cache.players.add(p);
		}),
	);

	// "Top off" the draft class if <70 players imported
	const baseNumPlayers = Math.round(
		(g.get("numDraftRounds") * g.get("numActiveTeams") * 7) / 6,
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
	Object.assign(env, inputEnv);

	// Kind of hacky, only run this for the first host tab
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
	await lock.set(name, value);
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
		ratings: ["pos", "ovr", "pot", ...RATINGS],
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

	const p = await idb.cache.players.get(pid);

	if (p.tid !== g.get("userTid")) {
		return "You aren't allowed to do this.";
	}

	await player.release(p, justDrafted);
	await toUI("realtimeUpdate", [["playerMovement"]]);
	await recomputeLocalUITeamOvrs();
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
		numActiveTeams: g.get("numActiveTeams") - 1,
		numTeams: g.get("numTeams") - 1,
		teamInfoCache: g.get("teamInfoCache").slice(0, -1),
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

const resetPlayingTime = async (tids: number[] | undefined) => {
	const tids2 = tids !== undefined ? tids : [g.get("userTid")];

	const players = await idb.cache.players.indexGetAll("playersByTid", [
		0,
		Infinity,
	]);

	for (const p of players) {
		if (tids2.includes(p.tid)) {
			p.ptModifier = 1;
			await idb.cache.players.put(p);
		}
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
	const view = views[viewId];

	if (view) {
		const data = await view(inputs, updateEvents, prevData, conditions);
		return data === undefined ? {} : data;
	}

	return {};
};

const setLocal = async <T extends keyof Local>(key: T, value: Local[T]) => {
	if (key === "autoSave" && value === false) {
		await league.setGameAttributes({ godModeInPast: true });
		await idb.cache.flush();
	}

	// @ts-ignore
	local[key] = value;

	if (key === "autoSave" && value === true) {
		await idb.cache.flush();
		await idb.cache.fill();

		if (g.get("userTids").length === 1) {
			await league.updateMetaNameRegion(
				g.get("teamInfoCache")[g.get("userTids")[0]]?.name,
				g.get("teamInfoCache")[g.get("userTids")[0]]?.region,
			);
		} else {
			await league.updateMetaNameRegion("Multi Team Mode", "");
		}

		const l = await idb.meta.get("leagues", g.get("lid"));
		if (!l) {
			throw new Error(`No league with lid ${g.get("lid")} found`);
		}
		l.phaseText = `${g.get("season")} ${PHASE_TEXT[g.get("phase")]}`;
		l.difficulty = g.get("difficulty");
		await idb.meta.put("leagues", l);
	}
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
};

const updateExpansionDraftSetup = async (changes: {
	numProtectedPlayers?: string;
	teams?: ExpansionDraftSetupTeam[];
}) => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "setup") {
		throw new Error("Invalid expansion draft phase");
	}

	await setGameAttributes({
		expansionDraft: {
			...expansionDraft,
			...changes,
		},
	});
};

const advanceToPlayerProtection = async (conditions: Conditions) => {
	const errors = await expansionDraft.advanceToPlayerProtection(
		false,
		conditions,
	);

	if (errors) {
		return errors;
	}

	await phase.newPhase(PHASE.EXPANSION_DRAFT, conditions);
};

const autoProtect = async (tid: number) => {
	const pids = await expansionDraft.autoProtect(tid);
	await expansionDraft.updateProtectedPids(tid, pids);
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const cancelExpansionDraft = async () => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase !== "protection") {
		throw new Error("Invalid expansion draft phase");
	}
	for (let i = 0; i < expansionDraft.expansionTids.length; i++) {
		await removeLastTeam();
	}
	await setGameAttributes({
		expansionDraft: { phase: "setup" },
		phase: g.get("nextPhase"),
		nextPhase: undefined,
	});
	await updatePhase();
	await updatePlayMenu();
};

const updateProtectedPlayers = async (tid: number, protectedPids: number[]) => {
	await expansionDraft.updateProtectedPids(tid, protectedPids);
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const startExpansionDraft = async () => {
	await expansionDraft.start();
	await toUI("realtimeUpdate", [["gameAttributes"]]);
};

const startFantasyDraft = async (tids: number[], conditions: Conditions) => {
	await phase.newPhase(PHASE.FANTASY_DRAFT, conditions, tids);
};

const switchTeam = async (tid: number, conditions: Conditions) => {
	const t = await idb.cache.teams.get(tid);
	if (!t) {
		throw new Error("Invalid tid");
	}

	const userTid = g.get("userTid");
	if (userTid !== tid) {
		await team.switchTo(tid);
		await updateStatus("Idle");
		await updatePlayMenu();
	}

	const expansionDraft = g.get("expansionDraft");
	if (
		g.get("phase") === PHASE.EXPANSION_DRAFT &&
		expansionDraft.phase === "protection" &&
		expansionDraft.allowSwitchTeam
	) {
		await league.setGameAttributes({
			expansionDraft: {
				...expansionDraft,
				allowSwitchTeam: false,
			},
		});

		if (userTid !== tid) {
			logEvent(
				{
					saveToDb: false,
					text: `You are now the GM of a new expansion team, the ${t.region} ${t.name}!`,
					type: "info",
				},
				conditions,
			);
		}
	}
};

const updateBudget = async (
	budgetAmounts: {
		coaching: number;
		facilities: number;
		health: number;
		scouting: number;
		ticketPrice: number;
	},
	adjustForInflation: boolean,
) => {
	const t = await idb.cache.teams.get(g.get("userTid"));

	for (const key of helpers.keys(budgetAmounts)) {
		// Check for NaN before updating
		if (budgetAmounts[key] === budgetAmounts[key]) {
			t.budget[key].amount = budgetAmounts[key];
		}
	}

	t.adjustForInflation = adjustForInflation;

	await idb.cache.teams.put(t);
	await finances.updateRanks(["budget"]);
	await toUI("realtimeUpdate", [["teamFinances"]]);
};

const updateConfsDivs = async (
	confs: { cid: number; name: string }[],
	divs: { cid: number; did: number; name: string }[],
) => {
	// First some sanity checks to make sure they're consistent
	if (divs.length === 0) {
		throw new Error("No divisions");
	}
	for (const div of divs) {
		const conf = confs.find(c => c.cid === div.cid);
		if (!conf) {
			throw new Error("div has invalid cid");
		}
	}

	// Second, update any teams belonging to a deleted division
	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		const div = divs.find(d => d.did === t.did);
		const conf = confs.find(c => c.cid === t.cid);
		const divMatchesConf = div && conf ? conf.cid === div.cid : false;

		if (divMatchesConf) {
			// No update needed
			continue;
		}

		let newDid: number | undefined;
		let newCid: number | undefined;

		if (div) {
			// Move to correct conference based on did
			newCid = div.cid;
		} else if (conf) {
			// Put in last division of conference, if possible
			const potentialDivs = divs.filter(d => d.cid === conf.cid);
			if (potentialDivs.length > 0) {
				newDid = potentialDivs[potentialDivs.length - 1].did;
			}
		}

		// If this hasn't resulted in a newCid or newDid, we need to pick a new one
		if (newDid === undefined && newCid === undefined) {
			const newDiv = divs[divs.length - 1];
			newDid = newDiv.did;
			newCid = newDiv.cid;
		}

		if (newDid !== undefined) {
			t.did = newDid;
		}
		if (newCid !== undefined) {
			t.cid = newCid;
		}
		await idb.cache.teams.put(t);

		if (g.get("phase") < PHASE.PLAYOFFS) {
			const teamSeason = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[t.tid, g.get("season")],
			);

			if (teamSeason) {
				// Also apply team info changes to this season
				if (newDid !== undefined) {
					teamSeason.did = newDid;
				}
				if (newCid !== undefined) {
					teamSeason.cid = newCid;
				}

				await idb.cache.teamSeasons.put(teamSeason);
			}
		}
	}

	await league.setGameAttributes({ confs, divs });
	await toUI("realtimeUpdate", [["gameAttributes"]]);
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
			if (
				dp.season !== "fantasy" &&
				dp.season !== "expansion" &&
				dp.season > maxSeason
			) {
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
			g.get("teamInfoCache")[gameAttributes.userTids[0]]?.name,
			g.get("teamInfoCache")[gameAttributes.userTids[0]]?.region,
		);
	} else {
		league.updateMetaNameRegion("Multi Team Mode", "");
	}

	await toUI("realtimeUpdate", [["g.userTids"]]);
};

const updateOptions = async (
	options: Options & {
		realPlayerPhotos: string;
		realTeamInfo: string;
	},
) => {
	const validateRealTeamInfo = (abbrev: string, teamInfo: any) => {
		const strings = ["abbrev", "region", "name", "imgURL"];
		const numbers = ["pop"];
		for (const [key, value] of Object.entries(teamInfo as any)) {
			if (strings.includes(key)) {
				if (typeof value !== "string") {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" is not a string`,
					);
				}
			} else if (numbers.includes(key)) {
				if (typeof value !== "number") {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" is not a number`,
					);
				}
			} else if (key === "colors") {
				if (!Array.isArray(value)) {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" is not an array`,
					);
				}
				if (value.length !== 3) {
					throw new Error(
						`Invalid data format in real team info - value for "${abbrev}.${key}" should have 3 colors`,
					);
				}
				for (const color of value) {
					if (typeof color !== "string") {
						throw new Error(
							`Invalid data format in real team info - value for "${abbrev}.${key}" is not an array of strings`,
						);
					}
				}
			} else if (key !== "seasons") {
				throw new Error(
					`Invalid data format in real team info - unknown property "${abbrev}.${key}"`,
				);
			}
		}
	};

	let realPlayerPhotos;
	let realTeamInfo;
	if (options.realPlayerPhotos !== "") {
		try {
			realPlayerPhotos = JSON.parse(options.realPlayerPhotos);
		} catch (err) {
			console.log(err);
			throw new Error("Invalid JSON in real player photos");
		}
		if (typeof realPlayerPhotos !== "object") {
			throw new Error(
				"Invalid data format in real player photos - input is not an object",
			);
		}
		for (const [key, value] of Object.entries(realPlayerPhotos)) {
			if (typeof value !== "string") {
				throw new Error(
					`Invalid data format in real player photos - value for "${key}" is not a string`,
				);
			}
		}
	}
	if (options.realTeamInfo !== "") {
		try {
			realTeamInfo = JSON.parse(options.realTeamInfo);
		} catch (err) {
			console.log(err);
			throw new Error("Invalid JSON in real team info");
		}
		if (typeof realTeamInfo !== "object") {
			throw new Error(
				"Invalid data format in real team info - input is not an object",
			);
		}
		for (const [abbrev, teamInfo] of Object.entries(realTeamInfo)) {
			validateRealTeamInfo(abbrev, teamInfo);
			if (typeof teamInfo !== "object" || teamInfo === null) {
				throw new Error(
					"Invalid data format in real team info - input is not an object",
				);
			}
			if ((teamInfo as any).seasons) {
				for (const [key, value] of Object.entries((teamInfo as any).seasons)) {
					const keyParsed = parseInt(key);
					if (Number.isNaN(keyParsed)) {
						throw new Error(
							`Invalid data format in real player photos - season is not an integer`,
						);
					}
					validateRealTeamInfo(`${abbrev}.${key}`, value);
				}
			}
		}
	}

	await idb.meta.put("attributes", options, "options");
	await idb.meta.put("attributes", realPlayerPhotos, "realPlayerPhotos");
	await idb.meta.put("attributes", realTeamInfo, "realTeamInfo");
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
		tid: number;
		cid?: number;
		did: number;
		region: string;
		name: string;
		abbrev: string;
		imgURL?: string;
		pop: number | string;
		stadiumCapacity: number | string;
		colors: [string, string, string];
		disabled?: boolean;
	}[],
) => {
	let userName;
	let userRegion;
	const teams = await idb.cache.teams.getAll();

	for (const t of teams) {
		const newTeam = newTeams.find(t2 => t2.tid === t.tid);
		if (!newTeam) {
			throw new Error(`New team not found for tid ${t.tid}`);
		}

		if (newTeam.did !== undefined) {
			const newDiv = g.get("divs").find(div => div.did === newTeam.did);
			if (newDiv) {
				t.did = newDiv.did;
				t.cid = newDiv.cid;
			}
		}

		t.region = newTeam.region;
		t.name = newTeam.name;
		t.abbrev = newTeam.abbrev;

		if (newTeam.hasOwnProperty("imgURL")) {
			t.imgURL = newTeam.imgURL;
		}

		t.colors = newTeam.colors;

		t.pop = parseFloat(newTeam.pop as string);
		t.stadiumCapacity = parseInt(newTeam.stadiumCapacity as string, 10);

		const disableTeam = newTeam.disabled && !t.disabled;
		const enableTeam = !newTeam.disabled && t.disabled;

		t.disabled = !!newTeam.disabled;

		if (Number.isNaN(t.pop)) {
			throw new Error("Invalid pop");
		}

		if (Number.isNaN(t.stadiumCapacity)) {
			throw new Error("Invalid stadiumCapacity");
		}

		await idb.cache.teams.put(t);

		if (t.tid === g.get("userTid")) {
			userName = t.name;
			userRegion = t.region;
		}

		if (enableTeam) {
			await draft.createTeamPicks(t.tid);
			await draft.deleteLotteryResultIfNoDraftYet();

			if (t.tid === g.get("userTid")) {
				await league.setGameAttributes({
					gameOver: false,
				});
				await updateStatus();
				await updatePlayMenu();
			}
		} else if (disableTeam) {
			await team.disable(t.tid);
		}

		// Also apply team info changes to this season
		if (g.get("phase") < PHASE.PLAYOFFS) {
			let teamSeason:
				| TeamSeason
				| TeamSeasonWithoutKey = await idb.cache.teamSeasons.indexGet(
				"teamSeasonsByTidSeason",
				[t.tid, g.get("season")],
			);

			if (enableTeam) {
				const prevSeason = await idb.cache.teamSeasons.indexGet(
					"teamSeasonsByTidSeason",
					[t.tid, g.get("season") - 1],
				);

				teamSeason = team.genSeasonRow(t, prevSeason);
			}

			if (teamSeason && !t.disabled) {
				teamSeason.cid = t.cid;
				teamSeason.did = t.did;
				teamSeason.region = t.region;
				teamSeason.name = t.name;
				teamSeason.abbrev = t.abbrev;
				teamSeason.imgURL = t.imgURL;
				teamSeason.colors = t.colors;
				teamSeason.pop = t.pop;
				teamSeason.stadiumCapacity = t.stadiumCapacity;

				await idb.cache.teamSeasons.put(teamSeason);
			}
		}
	}

	if (userName !== undefined && userRegion !== undefined) {
		await league.updateMetaNameRegion(userName, userRegion);
	}
	await league.setGameAttributes({
		teamInfoCache: orderBy(newTeams, "tid").map(t => ({
			abbrev: t.abbrev,
			disabled: t.disabled,
			imgURL: t.imgURL,
			name: t.name,
			region: t.region,
		})),
	});
};

const upsertCustomizedPlayer = async (
	p: Player | PlayerWithoutKey,
	originalTid: number,
	season: number,
	updatedRatingsOrAge: boolean,
	conditions: Conditions,
): Promise<number> => {
	const r = p.ratings.length - 1;

	// Fix draft and ratings season
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

	// If player is now retired, check HoF eligibility
	if (
		typeof p.pid === "number" &&
		p.tid === PLAYER.RETIRED &&
		originalTid !== PLAYER.RETIRED
	) {
		player.retire(p as Player, conditions, {
			allowRetiredNotification: false,
			forceHofNotification: true,
		});
	}

	// Keep track of contract in p.salaries
	if (
		p.tid >= 0 &&
		(p.salaries.length === 0 ||
			p.contract.amount !== p.salaries[p.salaries.length - 1].amount ||
			p.contract.exp !== p.salaries[p.salaries.length - 1].season)
	) {
		// Remove salaries that are now obsolete
		let lastCompletedSeason = g.get("season");
		if (g.get("phase") <= PHASE.PLAYOFFS) {
			lastCompletedSeason -= 1;
		}
		p.salaries = p.salaries.filter(
			salary => salary.season <= lastCompletedSeason,
		);

		player.setContract(p, p.contract, true);
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

	if (p.tid >= 0 && p.tid !== originalTid) {
		if (!p.transactions) {
			p.transactions = [];
		}
		p.transactions.push({
			season: g.get("season"),
			phase: g.get("phase"),
			tid: p.tid,
			type: "godMode",
		});
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

	p.relatives = relatives;

	// Save to database, adding pid if it doesn't already exist
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
	discardUnsavedProgress,
	draftLottery,
	draftUser,
	exportDraftClass,
	exportLeague,
	exportPlayerAveragesCsv,
	exportPlayerGamesCsv,
	generateFace,
	getLeagueInfo,
	getLeagueName,
	getLocal,
	getRandomRatings,
	getTradingBlockOffers,
	getVersionWorker,
	handleUploadedDraftClass,
	init,
	lockSet,
	proposeTrade,
	ratingsStatsPopoverInfo,
	realtimeUpdate,
	releasePlayer,
	removeLeague,
	reorderDepthDrag,
	reorderRosterDrag,
	resetPlayingTime,
	runBefore,
	setLocal,
	sign,
	updateExpansionDraftSetup,
	advanceToPlayerProtection,
	autoProtect,
	cancelExpansionDraft,
	updateProtectedPlayers,
	startExpansionDraft,
	startFantasyDraft,
	switchTeam,
	tradeCounterOffer,
	updateBudget,
	updateConfsDivs,
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
