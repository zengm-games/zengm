import { idb } from "../../db/index.ts";
import { rosterOptimalStyle, seasonStyle } from "./style.ts";

// Recompute every team's effective season style from its coach (philosophy +
// adaptability) and current roster, storing it on team.coaching so the sim and
// UI read it directly. Call each preseason and after coach changes.
const updateTeamCoaching = async (tids?: number[]) => {
	const teams = await idb.cache.teams.getAll();
	const coaches = await idb.cache.coaches.getAll();
	const coachByTid = new Map(coaches.map((c) => [c.tid, c]));

	for (const t of teams) {
		if (t.disabled || (tids && !tids.includes(t.tid))) {
			continue;
		}
		const coach = coachByTid.get(t.tid);
		if (!coach) {
			continue;
		}

		const players = await idb.cache.players.indexGetAll("playersByTid", t.tid);
		t.coaching = seasonStyle(coach, rosterOptimalStyle(players));
		await idb.cache.teams.put(t);
	}
};

export default updateTeamCoaching;
