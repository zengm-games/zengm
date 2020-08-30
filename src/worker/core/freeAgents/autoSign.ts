import orderBy from "lodash/orderBy";
import { PHASE, PLAYER } from "../../../common";
import { player, team } from "..";
import getBest from "./getBest";
import { idb } from "../../db";
import { g, local, random } from "../../util";

/**
 * AI teams sign free agents.
 *
 * Each team (in random order) will sign free agents up to their salary cap or roster size limit. This should eventually be made smarter
 *
 * @memberOf core.freeAgents
 * @return {Promise}
 */
const autoSign = async () => {
	const players = await idb.cache.players.indexGetAll(
		"playersByTid",
		PLAYER.FREE_AGENT,
	);

	if (players.length === 0) {
		return;
	}

	// List of free agents, sorted by value
	const playersSorted = orderBy(players, "value", "desc");

	// Randomly order teams
	const teams = await idb.cache.teams.getAll();
	random.shuffle(teams);

	for (const t of teams) {
		// Skip the user's team
		if (
			g.get("userTids").includes(t.tid) &&
			!local.autoPlayUntil &&
			!g.get("spectator")
		) {
			continue;
		}

		if (t.disabled) {
			continue;
		}

		// Small chance of actually trying to sign someone in free agency, gets greater as time goes on
		if (
			process.env.SPORT === "basketball" &&
			g.get("phase") === PHASE.FREE_AGENCY &&
			Math.random() < (0.99 * g.get("daysLeft")) / 30
		) {
			continue;
		}

		// Skip rebuilding teams sometimes
		if (
			process.env.SPORT === "basketball" &&
			t.strategy === "rebuilding" &&
			Math.random() < 0.7
		) {
			continue;
		}

		const playersOnRoster = await idb.cache.players.indexGetAll(
			"playersByTid",
			t.tid,
		);

		if (playersOnRoster.length < g.get("maxRosterSize")) {
			const payroll = await team.getPayroll(t.tid);
			const p = getBest(playersOnRoster, playersSorted, payroll);

			if (p) {
				await player.sign(p, t.tid, p.contract, g.get("phase"));
				await idb.cache.players.put(p);
				await team.rosterAutoSort(t.tid);
			}
		}
	}
};

export default autoSign;
