// @flow

import { idb } from "../db";
import { g, overrides } from "../util";
import type { GetOutput, UpdateEvents } from "../../common/types";

async function updatePowerRankings(
	inputs: GetOutput,
	updateEvents: UpdateEvents,
): void | { [key: string]: any } {
	if (updateEvents.includes("firstRun") || updateEvents.includes("gameSim")) {
		const [teams, playersRaw] = await Promise.all([
			idb.getCopies.teamsPlus({
				attrs: ["tid", "abbrev", "region", "name", "depth"],
				seasonAttrs: ["won", "lost", "lastTen"],
				stats: ["gp", "mov"],
				season: g.season,
			}),
			idb.cache.players.indexGetAll("playersByTid", [0, Infinity]),
		]);

		const players = await idb.getCopies.playersPlus(playersRaw, {
			attrs: ["tid", "injury"],
			ratings: ["ovr"],
			season: g.season,
		});

		// Calculate team ovr ratings
		for (const t of teams) {
			const teamPlayers = players.filter(p => p.tid === t.tid);
			const teamPlayersCurrent = teamPlayers.filter(
				p => p.injury.gamesRemaining === 0,
			);

			if (!overrides.core.team.ovr) {
				throw new Error("Missing overrides.core.team.ovr");
			}
			t.ovr = overrides.core.team.ovr(teamPlayers);

			if (!overrides.core.team.ovr) {
				throw new Error("Missing overrides.core.team.ovr");
			}
			t.ovrCurrent = overrides.core.team.ovr(teamPlayersCurrent);
		}

		// Calculate score
		for (const t of teams) {
			// Start with MOV
			t.score = t.stats.mov;

			// Add estimated MOV from ovr (0/100 to -30/30)
			const estimatedMOV = t.ovr * 0.6 - 30;
			t.score += estimatedMOV;

			let winsLastTen = parseInt(t.seasonAttrs.lastTen.split("-")[0], 10);
			if (Number.isNaN(winsLastTen)) {
				winsLastTen = 0;
			}

			// Modulate point differential by recent record: +10 for 10-0 in last 10 and -10 for 0-10
			t.score += -10 + 2 * winsLastTen;
		}

		teams.sort((a, b) => b.score - a.score);
		for (let i = 0; i < teams.length; i++) {
			teams[i].rank = i + 1;
		}

		return {
			teams,
			userTid: g.userTid,
		};
	}
}

export default {
	runBefore: [updatePowerRankings],
};
