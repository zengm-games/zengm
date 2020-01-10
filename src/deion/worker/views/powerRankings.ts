import { idb } from "../db";
import { g, overrides } from "../util";
import { UpdateEvents } from "../../common/types";

async function updatePowerRankings(
	{
		season,
	}: {
		season: number;
	},
	updateEvents: UpdateEvents,
	state: any,
): Promise<void | {
	[key: string]: any;
}> {
	if (
		(season === g.season && updateEvents.includes("gameSim")) ||
		season !== state.season
	) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name", "depth"],
			seasonAttrs: ["won", "lost", "lastTen"],
			stats: ["gp", "mov"],
			season,
		}); // Calculate team ovr ratings

		for (const t of teams) {
			let teamPlayers;

			if (g.season === season) {
				teamPlayers = await idb.cache.players.indexGetAll(
					"playersByTid",
					t.tid,
				);
			} else {
				teamPlayers = await idb.getCopies.players({
					statsTid: t.tid,
				});
			}

			teamPlayers = await idb.getCopies.playersPlus(teamPlayers, {
				attrs: ["tid", "injury"],
				ratings: ["ovr", "pos"],
				stats: ["season", "tid"],
				season,
				showNoStats: g.season === season,
				showRookies: g.season === season,
				fuzz: true,
				tid: t.tid,
			});
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
		} // Calculate score

		for (const t of teams) {
			// Start with MOV, scaled for games played
			t.score = (t.stats.mov * t.stats.gp) / g.numGames; // Add estimated MOV from ovr (0/100 to -30/30)

			const estimatedMOV = t.ovr * 0.6 - 30;
			t.score += estimatedMOV;
			let winsLastTen = parseInt(t.seasonAttrs.lastTen.split("-")[0], 10);

			if (Number.isNaN(winsLastTen)) {
				winsLastTen = 0;
			} // Modulate point differential by recent record: +10 for 10-0 in last 10 and -10 for 0-10

			t.score += -10 + 2 * winsLastTen;
		}

		teams.sort((a, b) => b.score - a.score);

		for (let i = 0; i < teams.length; i++) {
			teams[i].rank = i + 1;
		}

		return {
			season,
			teams,
			userTid: g.userTid,
		};
	}
}

export default {
	runBefore: [updatePowerRankings],
};
