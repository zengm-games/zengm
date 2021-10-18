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
): Promise<number> => {};

export default create;
