import { PHASE } from "../../common/constants.ts";
import type {
	ScheduleGameWithoutKey,
	TeamFiltered,
	UpdateEvents,
} from "../../common/types.ts";
import { groupByUnique, maxBy, orderBy } from "../../common/utils.ts";
import { season } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";

export const formatScheduleForEditor = (
	scheduleRaw: ScheduleGameWithoutKey[],
	teams: TeamFiltered<["tid"], ["abbrev"], any, number>[],
) => {
	const teamsByTid = groupByUnique(teams, "tid");

	const schedule = scheduleRaw.map((game) => {
		const isAllStarGame = game.homeTid === -1 && game.awayTid === -2;
		if (isAllStarGame) {
			return {
				type: "allStarGame" as const,
				...game,
			};
		}

		const isTradeDeadline = game.homeTid === -3 && game.awayTid === -3;
		if (isTradeDeadline) {
			return {
				type: "tradeDeadline" as const,
				...game,
			};
		}

		return {
			type: "game" as const,
			...game,
			homeAbbrev: teamsByTid[game.homeTid]!.seasonAttrs.abbrev,
			awayAbbrev: teamsByTid[game.awayTid]!.seasonAttrs.abbrev,
		};
	});

	const schedule2: (
		| (typeof schedule)[number]
		| {
				type: "placeholder";
				day: number;
		  }
	)[] = schedule;

	return schedule2;
};

const updateScheduleEditor = async (
	inputs: void,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("newPhase")
	) {
		const scheduleRaw = await season.getSchedule();

		const teams = await idb.getCopies.teamsPlus(
			{
				attrs: ["tid"],
				seasonAttrs: ["abbrev", "region", "name", "tid", "cid", "did"],
				season: g.get("season"),
				active: true,
			},
			"noCopyCache",
		);

		const schedule = formatScheduleForEditor(scheduleRaw, teams);

		let canRegenerateSchedule = g.get("phase") === PHASE.REGULAR_SEASON;
		if (canRegenerateSchedule) {
			const teams = await idb.getCopies.teamsPlus(
				{
					attrs: ["tid"],
					stats: ["gp"],
					season: g.get("season"),
				},
				"noCopyCache",
			);

			for (const t of teams) {
				if (t.stats.gp !== 0) {
					canRegenerateSchedule = false;
					break;
				}
			}
		}

		const games = await idb.cache.games.getAll();
		const numGamesPlayedAlready = games.length;
		const allStars = await idb.cache.allStars.get(g.get("season"));
		const allStarGameAlreadyHappened = !!allStars;

		const maxDayAlreadyPlayed = maxBy(games, "day")?.day ?? 0;

		return {
			allStarGame: g.get("allStarGame"),
			allStarGameAlreadyHappened,
			canRegenerateSchedule,
			maxDayAlreadyPlayed,
			numGamesPlayedAlready,
			phase: g.get("phase"),
			schedule,
			teams: orderBy(teams, [(t) => t.seasonAttrs.abbrev]),
			tradeDeadline: g.get("tradeDeadline"),
			userTid: g.get("userTid"),
		};
	}
};

export default updateScheduleEditor;
