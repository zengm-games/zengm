import { DEFAULT_LEVEL } from "../../common/budgetLevels.ts";
import type { Achievement, Awards } from "../../common/types.ts";
import { mockIDBLeague, resetCache, resetG } from "../../test/helpers.ts";
import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import achievements from "./achievements.ts";
import g from "./g.ts";
import helpers from "./helpers.ts";

export const makeAwards = (
	awards: Partial<Awards> & Pick<Awards, "awards">,
): Awards => {
	return {
		season: g.get("season"),
		bestRecord: 0,
		bestRecordConfs: {},
		bestRecordDivs: {},
		...awards,
	};
};

type AchievementWithCheck = Achievement & {
	check: NonNullable<Achievement["check"]>;
};

export const get = (slug: string) => {
	const achievement = achievements.find(
		(achievement2) => slug === achievement2.slug,
	);
	if (!achievement) {
		throw new Error(`No achievement found for slug "${slug}"`);
	}
	if (!achievement.check) {
		throw new Error(`No check function for slug "${slug}"`);
	}
	return achievement as AchievementWithCheck;
};

export const cbBeforeAll = async () => {
	resetG();
	g.setWithoutSavingToDB("season", 2013);
	g.setWithoutSavingToDB("userTid", 7);

	const teamsDefault = helpers.getTeamsDefault();
	await resetCache({
		players: [
			player.generate(0, 30, 2010, true, DEFAULT_LEVEL),
			player.generate(0, 30, 2010, true, DEFAULT_LEVEL),
		],
		teams: teamsDefault.map(team.generate),
		teamSeasons: teamsDefault.map((t) => team.genSeasonRow(t)),
	});

	idb.league = mockIDBLeague();
};
export const cbAfterAll = () => {
	// @ts-expect-error
	idb.league = undefined;
};
