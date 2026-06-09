import { PLAYER } from "../../common/constants.ts";
import { getCoachingLevel } from "../../common/staff.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";
import { staff as staffCore } from "../core/index.ts";
import { idb } from "../db/index.ts";

const updateStaff = async (
	{ abbrev, tid }: ViewInput<"staff">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("newPhase") ||
		updateEvents.includes("staff") ||
		updateEvents.includes("team") ||
		updateEvents.includes("teamFinances") ||
		tid !== state.tid
	) {
		const t = await idb.cache.teams.get(tid);
		if (!t || t.disabled) {
			throw new Error("Team not found");
		}

		const coaches = await idb.cache.staff.getAll();
		const developmentInfo = staffCore.getDevelopmentInfoFromCoaches(
			coaches,
			tid,
		);

		return {
			abbrev,
			availableCoaches: coaches
				.filter((coach) => coach.tid === PLAYER.FREE_AGENT)
				.sort((a, b) => b.quality - a.quality),
			budgetLevel: t.budget.coaching,
			developmentLevel: getCoachingLevel(developmentInfo),
			teamName: t.name,
			teamRegion: t.region,
			teamStaff: staffCore.getTeamStaff(coaches, tid),
			tid,
		};
	}
};

export default updateStaff;
