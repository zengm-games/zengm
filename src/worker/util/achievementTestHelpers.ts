import type { Achievement, Awards2 } from "../../common/types.ts";
import achievements from "./achievements.ts";
import g from "./g.ts";

export const makeAwards = (
	awards: Partial<Awards2> & Pick<Awards2, "awards">,
): Awards2 => {
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
