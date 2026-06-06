import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import { PLAYER } from "../../../common/constants.ts";
import type { Conditions } from "../../../common/types.ts";

// Fire a team's coach: they become a free agent. The team is left without a coach
// until one is hired (autoHireFire fills AI teams; the user hires from the UI).
const fire = async (tid: number, conditions?: Conditions, log = true) => {
	const coaches = await idb.cache.coaches.indexGetAll("coachesByTid", tid);
	for (const coach of coaches) {
		coach.tid = PLAYER.FREE_AGENT;
		await idb.cache.coaches.put(coach);

		if (log) {
			const t = await idb.cache.teams.get(tid);
			const teamName = t
				? `<a href="${helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`])}">${t.region} ${t.name}</a>`
				: "team";
			await logEvent(
				{
					type: "coachFired",
					text: `The ${teamName} fired head coach ${coach.firstName} ${coach.lastName}.`,
					tids: [tid],
					showNotification: g.get("userTids").includes(tid),
					score: 20,
				},
				conditions,
			);
		}
	}
};

export default fire;
