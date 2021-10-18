import { groupBy } from "../../../common/groupBy";
import orderBy from "lodash-es/orderBy";
import { Cache, connectLeague, idb } from "../../db";
import { isSport, PHASE, PLAYER, POSITION_COUNTS } from "../../../common";
import { draft, finances, freeAgents, league, player, team, season } from "..";
import remove from "./remove";
import {
	g,
	helpers,
	local,
	lock,
	random,
	toUI,
	updatePhase,
	updateStatus,
	logEvent,
} from "../../util";
import type {
	PlayerWithoutKey,
	MinimalPlayerRatings,
	GameAttributesLeague,
	League,
	TeamBasic,
	TeamSeasonWithoutKey,
	TeamStatsWithoutKey,
	PlayerContract,
	Conditions,
} from "../../../common/types";
import { getAutoTicketPriceByTid } from "../game/attendance";

export type LeagueFile = {
	version?: number;
	meta?: any;
	startingSeason: number;
	draftLotteryResults?: any[];
	draftPicks?: any[];
	draftOrder?: any[];
	games?: any[];
	gameAttributes?: Record<string, any>;
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
	headToHeads?: any[];
};

export type TeamInfo = TeamBasic & {
	disabled?: boolean;
	stadiumCapacity?: number;
	seasons?: TeamSeasonWithoutKey[];
	stats?: TeamStatsWithoutKey[];
};

// Creates a league, writing nothing to the database.
export const createWithoutSaving = async (
	tid: number,
	leagueFile: LeagueFile,
	shuffleRosters: boolean,
	conditions?: Conditions,
) => {
	let players: PlayerWithoutKey[];

	// See if imported roster has draft picks included. If so, create less than 70 (scaled for number of teams)
	const seasonOffset = g.get("phase") >= PHASE.RESIGN_PLAYERS ? 1 : 0;
	const existingDraftClasses: [any[], any[], any[]] = [[], [], []];
	for (const p of players) {
		if (p.tid === PLAYER.UNDRAFTED) {
			if (p.draft.year === g.get("season") + seasonOffset) {
				existingDraftClasses[0].push(p);
			} else if (p.draft.year === g.get("season") + seasonOffset + 1) {
				existingDraftClasses[1].push(p);
			} else if (p.draft.year === g.get("season") + seasonOffset + 2) {
				existingDraftClasses[2].push(p);
			}
		}
	}

	// If the draft has already happened this season but next year's class hasn't been bumped up, don't create any PLAYER.UNDRAFTED
	if (g.get("phase") >= 0) {
		if (
			g.get("phase") <= PHASE.DRAFT_LOTTERY ||
			g.get("phase") >= PHASE.RESIGN_PLAYERS
		) {
			const draftClass = await draft.genPlayersWithoutSaving(
				g.get("season") + seasonOffset,
				scoutingRank,
				existingDraftClasses[0],
			);
			players = players.concat(draftClass);
		}

		{
			const draftClass = await draft.genPlayersWithoutSaving(
				g.get("season") + 1 + seasonOffset,
				scoutingRank,
				existingDraftClasses[1],
			);
			players = players.concat(draftClass);
		}

		{
			const draftClass = await draft.genPlayersWithoutSaving(
				g.get("season") + 2 + seasonOffset,
				scoutingRank,
				existingDraftClasses[2],
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
				.map(p => ({
					value: p.value,
					ratings: p.ratings.at(-1),
				}));
			const ovr = team.ovr(teamPlayers);
			teams[i].strategy = ovr >= 60 ? "contending" : "rebuilding";
		}
	}
};

/**
 * Create a new league.
 *
 * @memberOf core.league
 * @param {string} name The name of the league.
 * @param {number} tid The team ID for the team the user wants to manage (or -1 for random).
 */
const create = async (
	{
		name,
		tid,
		leagueFile,
		shuffleRosters = false,
		importLid,
		realPlayers,
	}: {
		name: string;
		tid: number;
		leagueFile: LeagueFile;
		shuffleRosters?: boolean;
		importLid?: number | undefined | null;
		realPlayers?: boolean;
	},
	conditions?: Conditions,
): Promise<number> => {
	const leagueData = await createWithoutSaving(
		tid,
		leagueFile,
		shuffleRosters,
		conditions,
	);

	const userTid =
		leagueData.gameAttributes.userTid[
			leagueData.gameAttributes.userTid.length - 1
		].value;
	const l: League = {
		name,
		tid: userTid,
		phaseText: "",
		teamName: leagueData.teams[userTid].name,
		teamRegion: leagueData.teams[userTid].region,
		heartbeatID: undefined,
		heartbeatTimestamp: undefined,
		difficulty: leagueData.gameAttributes.difficulty,
		created: new Date(),
		lastPlayed: new Date(),
		startingSeason: g.get("startingSeason"),
		season: g.get("season"),
		imgURL:
			leagueData.teams[userTid].imgURLSmall ?? leagueData.teams[userTid].imgURL,
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

	const players0 = await idb.cache.players.getAll();
	for (const p of players0) {
		if (leagueFile.players === undefined) {
			// If no players were uploaded in custom league file, add some relatives!
			await player.addRelatives(p);
		}
	}

	// A new loop, because addRelatives updates the database
	const players1 = await idb.cache.players.getAll();
	for (const p of players1) {
		if (leagueFile.players) {
			// Fix jersey numbers, which matters for league files where that data might be invalid (conflicts) or incomplete
			if (p.tid >= 0 && p.stats.length > 0 && !p.stats.at(-1).jerseyNumber) {
				p.stats.at(-1).jerseyNumber = await player.genJerseyNumber(p);
			}
		}

		await player.updateValues(p);
		await idb.cache.players.put(p);
	}

	const pidsToNormalize = players0.filter(p => p.contract.temp).map(p => p.pid);
	await freeAgents.normalizeContractDemands({
		type: "newLeague",
		pids: pidsToNormalize,
	});

	// WHY IS THIS NEEDED? Can't use players0 because the addRelatives call above might make a copy of a player object and write it to the cache, in which case the prior objects for those players in players0 will be stale.
	const players = await idb.cache.players.getAll();

	// Adjustment for hard cap - lower contracts for teams above cap
	if (leagueFile.players === undefined && g.get("hardCap")) {
		const teams = await idb.cache.teams.getAll();
		for (const t of teams) {
			if (t.disabled) {
				continue;
			}
			const roster = players.filter(p => p.tid === t.tid);
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

	for (const p of players) {
		if (p.tid >= 0 && p.salaries.length === 0) {
			player.setContract(p, p.contract, true);
		}

		if ((p as any).rookieContract) {
			p.contract.rookie = true;
			delete (p as any).rookieContract;
		}

		delete p.contract.temp;

		// Maybe not needed, but let's be sure
		await idb.cache.players.put(p);
	}

	const skipNewPhase = leagueFile.gameAttributes?.phase !== undefined;

	if (!skipNewPhase || realPlayers) {
		await updatePhase();
		await updateStatus("Idle");

		// Auto sort rosters
		for (const t of leagueData.teams) {
			let noRosterOrderSet = true;
			if (isSport("basketball") && leagueFile.players) {
				for (const p of leagueFile.players) {
					if (p.tid === t.tid && typeof p.rosterOrder === "number") {
						noRosterOrderSet = false;
						break;
					}
				}
			}

			// If league file has players, don't auto sort even if skipNewPhase is false
			if (noRosterOrderSet || !g.get("userTids").includes(t.tid)) {
				await team.rosterAutoSort(t.tid);
			}
		}
	}

	if (g.get("phase") === PHASE.PLAYOFFS) {
		await season.newSchedulePlayoffsDay();
	}

	await draft.genPicks({
		realPlayers,
	});

	if (!leagueFile.events || leagueFile.events.length === 0) {
		await logEvent({
			text: "Welcome to your new league!",
			type: "newLeague",
			tids: [g.get("userTid")],
			showNotification: false,
			score: 20,
		});
	}

	const teams = await idb.cache.teams.getAll();
	for (const t of teams) {
		if (!t.disabled && t.autoTicketPrice !== false) {
			t.budget.ticketPrice.amount = await getAutoTicketPriceByTid(t.tid);
		}
	}
	await finances.updateRanks(["budget"]);

	await idb.cache.flush();
	await idb.cache.fill(); // Otherwise it keeps everything in memory!
	idb.cache.startAutoFlush();
	local.leagueLoaded = true;
	return lid;
};

export default create;
