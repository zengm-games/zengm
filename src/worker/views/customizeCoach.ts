import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import type { UpdateEvents, ViewInput } from "../../common/types.ts";

const updateCustomizeCoach = async (
	{ cid }: ViewInput<"customizeCoach">,
	updateEvents: UpdateEvents,
	state: { cid?: number },
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameAttributes") ||
		state.cid !== cid
	) {
		if (!g.get("godMode")) {
			return {
				errorMessage: "You can only edit coaches in God Mode.",
			};
		}

		if (cid === undefined) {
			return { errorMessage: "Invalid coach ID." };
		}

		const coach = await idb.cache.coaches.get(cid);
		if (!coach) {
			return { errorMessage: "Coach not found." };
		}

		return {
			coach: {
				...coach,
				age: g.get("season") - coach.born.year,
			},
			season: g.get("season"),
		};
	}
};

export default updateCustomizeCoach;
