// Old functions that used to be on idb, kept only for people using them from the worker console (bbgm.idb.getCopies and bbgm.idb.getCopy). Nothing in the app should use these.

import { player, team } from "../core/index.ts";
import { idb } from "./index.ts";
import type { EventsSelector } from "./merged/events.ts";
import type { GamesSelector } from "./merged/games.ts";
import type { PlayersSelector } from "./merged/players.ts";
import type { TeamSeasonsSelector } from "./merged/teamSeasons.ts";
import { helpers } from "../util/index.ts";
import type { EventBBGM, Player } from "../../common/types.ts";

type CopyType = "noCopyCache" | undefined;

const logged = new Set<string>();

// Only log the first time each function is used, since it could be called in a loop
const logDeprecated = (name: string, replacement: string) => {
	if (!logged.has(name)) {
		logged.add(name);
		console.log(`bbgm.idb.${name} is deprecated. Use ${replacement} instead.`);
	}
};

// Previously, rows were copied unless "noCopyCache" was passed, so changing them in the console didn't change the cache
const maybeCopy = <T>(rows: T, type: CopyType): T => {
	return type === "noCopyCache" ? rows : helpers.deepCopy(rows);
};

// The old functions returned everything for {}, but the new ones need undefined for that
type NoSelector = Record<string, never>;
const isNoSelector = (selector: object): selector is NoSelector => {
	return Object.keys(selector).length === 0;
};
const toSelector = <Selector extends object>(
	selector: Selector | NoSelector,
) => {
	return isNoSelector(selector) ? undefined : selector;
};

const events = async (
	{
		eid,
		filter,
		...selector
	}: (EventsSelector | NoSelector) & {
		eid?: number;
		filter?: (event: EventBBGM) => boolean;
	} = {},
	type?: CopyType,
) => {
	logDeprecated("getCopies.events", "bbgm.idb.merged.events.getAll");

	if (eid !== undefined) {
		const event = await idb.merged.events.get(eid);
		return maybeCopy(event ? [event] : [], type);
	}

	return maybeCopy(
		await idb.merged.events.getAll(toSelector(selector), { filter }),
		type,
	);
};

const games = async (
	{ gid, ...selector }: (GamesSelector | NoSelector) & { gid?: number } = {},
	type?: CopyType,
) => {
	logDeprecated("getCopies.games", "bbgm.idb.merged.games.getAll");

	if (gid !== undefined) {
		const game = await idb.merged.games.get(gid);
		return maybeCopy(game ? [game] : [], type);
	}

	return maybeCopy(await idb.merged.games.getAll(toSelector(selector)), type);
};

const players = async (
	{
		pid,
		filter,
		...selector
	}: (PlayersSelector | NoSelector) & {
		pid?: number;
		filter?: (p: Player) => boolean;
	} = {},
	type?: CopyType,
) => {
	logDeprecated("getCopies.players", "bbgm.idb.merged.players.getAll");

	if (pid !== undefined) {
		const p = await idb.merged.players.get(pid);
		return maybeCopy(p ? [p] : [], type);
	}

	return maybeCopy(
		await idb.merged.players.getAll(toSelector(selector), { filter }),
		type,
	);
};

const teamSeasons = async (
	{
		rid,
		...selector
	}: (TeamSeasonsSelector | NoSelector) & { rid?: number } = {},
	type?: CopyType,
) => {
	logDeprecated("getCopies.teamSeasons", "bbgm.idb.merged.teamSeasons.getAll");

	if (rid !== undefined) {
		const ts = await idb.merged.teamSeasons.get(rid);
		return maybeCopy(ts ? [ts] : [], type);
	}

	return maybeCopy(
		await idb.merged.teamSeasons.getAll(toSelector(selector)),
		type,
	);
};

// The old second argument ("noCopyCache") doesn't matter here, because the output is always new objects
const teamsPlus: typeof team.getFormattedAll = (options) => {
	logDeprecated("getCopies.teamsPlus", "bbgm.team.getFormattedAll");
	return team.getFormattedAll(options);
};

const playersPlus: typeof player.formatAll = (players, options) => {
	logDeprecated("getCopies.playersPlus", "bbgm.player.formatAll");
	return player.formatAll(players, options);
};

export const getCopies = {
	events,
	games,
	players,
	playersPlus,
	teamSeasons,
	teamsPlus,
};

const playerOne = async ({ pid }: { pid: number }, type?: CopyType) => {
	logDeprecated("getCopy.players", "bbgm.idb.merged.players.get");
	const p = await idb.merged.players.get(pid);
	return p ? maybeCopy(p, type) : undefined;
};

const playersPlusOne: typeof player.format = (p, options) => {
	logDeprecated("getCopy.playersPlus", "bbgm.player.format");
	return player.format(p, options);
};

const teamSeasonOne = async (
	input: (TeamSeasonsSelector | NoSelector) & { rid?: number },
	type?: CopyType,
) => {
	logDeprecated(
		"getCopy.teamSeasons",
		"bbgm.idb.merged.teamSeasons.getByTidSeason",
	);
	const ts = (await teamSeasons(input, "noCopyCache"))[0];
	return ts ? maybeCopy(ts, type) : undefined;
};

export const getCopy = {
	players: playerOne,
	playersPlus: playersPlusOne,
	teamSeasons: teamSeasonOne,
};
