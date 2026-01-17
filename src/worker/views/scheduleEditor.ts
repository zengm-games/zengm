import { PHASE } from "../../common/constants.ts";
import getWinner from "../../common/getWinner.ts";
import type {
	Game,
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
	completedGames: Game[],
) => {
	const teamsByTid = groupByUnique(teams, "tid");

	const schedule = [
		...completedGames
			.filter((game) => game.day !== undefined)
			.map((game) => {
				const awayTid = game.teams[1].tid;
				const homeTid = game.teams[0].tid;
				const winner = getWinner(game.teams);

				return {
					type: "completed" as const,
					day: game.day!,
					awayAbbrev: teamsByTid[awayTid]?.seasonAttrs.abbrev ?? "???",
					awayTid,
					homeAbbrev: teamsByTid[homeTid]?.seasonAttrs.abbrev ?? "???",
					homeTid,
					forceWin: undefined,
					winnerTid:
						winner === 0 ? homeTid : winner === 1 ? awayTid : undefined,
				};
			}),
		...scheduleRaw.map((game) => {
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
				awayAbbrev: teamsByTid[game.awayTid]!.seasonAttrs.abbrev,
				homeAbbrev: teamsByTid[game.homeTid]!.seasonAttrs.abbrev,
			};
		}),
	];

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
		const allStars = await idb.cache.allStars.get(g.get("season"));
		const allStarGameAlreadyHappened = !!allStars;

		const maxDayAlreadyPlayed = maxBy(games, "day")?.day ?? 0;

		const schedule = formatScheduleForEditor(scheduleRaw, teams, games);

		if (schedule.length === 0) {
			schedule.push({
				type: "placeholder",
				day: maxDayAlreadyPlayed + 1,
			});
		}

		return {
			allStarGame: g.get("allStarGame"),
			allStarGameAlreadyHappened,
			canRegenerateSchedule,
			maxDayAlreadyPlayed,
			phase: g.get("phase"),
			schedule,
			teams: orderBy(teams, [(t) => t.seasonAttrs.abbrev]),
			tradeDeadline: g.get("tradeDeadline"),
			userTid: g.get("userTid"),
		};
	}
};

export default updateScheduleEditor;
