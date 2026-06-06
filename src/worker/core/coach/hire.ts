import { idb } from "../../db/index.ts";
import { g, helpers, logEvent } from "../../util/index.ts";
import { PLAYER } from "../../../common/constants.ts";
import genContract from "./genContract.ts";
import updateTeamCoaching from "./updateTeamCoaching.ts";
import type { Conditions, PlayerContract } from "../../../common/types.ts";

// Hire a free-agent coach to a team. Any coach currently on that team becomes a
// free agent. Recomputes the team's effective style.
const hire = async (
	cid: number,
	tid: number,
	{
		contract,
		conditions,
		log = true,
	}: {
		contract?: PlayerContract;
		conditions?: Conditions;
		log?: boolean;
	} = {},
) => {
	const coach = await idb.cache.coaches.get(cid);
	if (!coach) {
		throw new Error("Invalid cid");
	}

	// Free the team's current coach(es).
	const current = await idb.cache.coaches.indexGetAll("coachesByTid", tid);
	for (const c of current) {
		if (c.cid !== cid) {
			c.tid = PLAYER.FREE_AGENT;
			await idb.cache.coaches.put(c);
		}
	}

	coach.tid = tid;
	coach.hiredYear = g.get("season");
	coach.contract = contract ?? genContract(coach.ratings.ovr);
	await idb.cache.coaches.put(coach);

	await updateTeamCoaching([tid]);

	if (log) {
		const t = await idb.cache.teams.get(tid);
		const teamName = t
			? `<a href="${helpers.leagueUrl(["roster", `${t.abbrev}_${t.tid}`])}">${t.region} ${t.name}</a>`
			: "team";
		await logEvent(
			{
				type: "coachHired",
				text: `The ${teamName} hired ${coach.firstName} ${coach.lastName} as their head coach.`,
				tids: [tid],
				showNotification: g.get("userTids").includes(tid),
				score: 20,
			},
			conditions,
		);
	}

	return coach;
};

export default hire;
