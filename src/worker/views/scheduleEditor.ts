import type { ScheduleGameWithoutKey } from "../../common/types.ts";
import { groupByUnique, orderBy } from "../../common/utils.ts";
import { season } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";

const updateScheduleEditor = async () => {
	const scheduleRaw: ScheduleGameWithoutKey[] = await season.getSchedule();

	const teams = await idb.getCopies.teamsPlus(
		{
			attrs: ["abbrev", "region", "name", "tid"],
			season: g.get("season"),
			active: true,
		},
		"noCopyCache",
	);
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
			homeAbbrev: teamsByTid[game.homeTid]!.abbrev,
			awayAbbrev: teamsByTid[game.awayTid]!.abbrev,
		};
	});

	return {
		godMode: g.get("godMode"),
		phase: g.get("phase"),
		initialSchedule: schedule,
		teams: orderBy(teams, ["abbrev"]),
		userTid: g.get("userTid"),
	};
};

export default updateScheduleEditor;
