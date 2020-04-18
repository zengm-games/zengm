import { idb } from "../db";
import { g, overrides } from "../util";
import type { UpdateEvents, ViewInput } from "../../common/types";

const updatePowerRankings = async (
	{ season }: ViewInput<"powerRankings">,
	updateEvents: UpdateEvents,
	state: any,
) => {
	if (
		(season === g.get("season") && updateEvents.includes("gameSim")) ||
		season !== state.season
	) {
		const teams = await idb.getCopies.teamsPlus({
			attrs: ["tid", "abbrev", "region", "name", "depth"],
			seasonAttrs: ["won", "lost", "lastTen"],
			stats: ["gp", "mov"],
			season,
		});

		// Calculate team ovr ratings
		const teamsWithRankings = await Promise.all(
			teams.map(async t => {
				let teamPlayers;

				if (g.get("season") === season) {
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
					showNoStats: g.get("season") === season,
					showRookies: g.get("season") === season,
					fuzz: true,
					tid: t.tid,
				});
				const teamPlayersCurrent = teamPlayers.filter(
					p => p.injury.gamesRemaining === 0,
				);

				const ovr = overrides.core.team.ovr!(teamPlayers);
				const ovrCurrent = overrides.core.team.ovr!(teamPlayersCurrent);

				// Calculate score

				// Start with MOV, scaled for games played
				let score = (t.stats.mov * t.stats.gp) / g.get("numGames");

				// Add estimated MOV from ovr (0/100 to -30/30)
				const estimatedMOV = ovr * 0.6 - 30;
				score += estimatedMOV;
				let winsLastTen = parseInt(t.seasonAttrs.lastTen.split("-")[0], 10);

				if (Number.isNaN(winsLastTen)) {
					winsLastTen = 0;
				}

				// Modulate point differential by recent record: +10 for 10-0 in last 10 and -10 for 0-10
				score += -10 + 2 * winsLastTen;

				return {
					...t,
					score,
					ovr,
					ovrCurrent,

					// Placeholder
					rank: -1,
				};
			}),
		);

		teamsWithRankings.sort((a, b) => b.score - a.score);

		for (let i = 0; i < teamsWithRankings.length; i++) {
			teamsWithRankings[i].rank = i + 1;
		}

		return {
			season,
			teams: teamsWithRankings,
			userTid: g.get("userTid"),
		};
	}
};

export default updatePowerRankings;
