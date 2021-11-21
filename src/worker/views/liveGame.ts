import { player, team } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import { setTeamInfo } from "./gameLog";
import type { UpdateEvents, ViewInput } from "../../common/types";
import { getPeriodName, isSport, PHASE } from "../../common";

const updatePlayByPlay = async (
	inputs: ViewInput<"liveGame">,
	updateEvents: UpdateEvents,
) => {
	const redirectToMenu = {
		redirectUrl: helpers.leagueUrl(["daily_schedule"]),
	};

	if (updateEvents.includes("firstRun") && !inputs.fromAction) {
		return redirectToMenu;
	}

	if (
		inputs.gid !== undefined &&
		inputs.playByPlay !== undefined &&
		inputs.playByPlay.length > 0
	) {
		const boxScore: any = helpers.deepCopy(
			await idb.cache.games.get(inputs.gid),
		);

		const otl = g.get("otl", "current");

		// Stats to set to 0
		const resetStatsPlayer = player.stats.raw;
		const resetStatsTeam = team.stats.raw;
		const allStarGame =
			boxScore.teams[0].tid === -1 || boxScore.teams[1].tid === -1;
		let allStars;

		if (allStarGame) {
			allStars = await idb.cache.allStars.get(g.get("season"));

			if (!allStars) {
				return redirectToMenu;
			}
		}

		boxScore.elam = allStarGame ? g.get("elamASG") : g.get("elam");

		boxScore.overtime = "";
		boxScore.quarter = `1st ${getPeriodName(boxScore.numPeriods)}`;
		boxScore.time = `${g.get("quarterLength")}:00`;
		boxScore.gameOver = false;

		for (let i = 0; i < boxScore.teams.length; i++) {
			const t = boxScore.teams[i];

			// Fix records, taking out result of this game
			// Keep in sync with LiveGame.tsx
			if (boxScore.playoffs) {
				if (t.playoffs) {
					if (boxScore.won.tid === t.tid) {
						t.playoffs.won -= 1;
					} else if (boxScore.lost.tid === t.tid) {
						t.playoffs.lost -= 1;
					}
				}
			} else {
				if (boxScore.won.pts === boxScore.lost.pts) {
					// Tied!
					if (t.tied !== undefined) {
						t.tied -= 1;
					}
				} else if (boxScore.won.tid === t.tid) {
					t.won -= 1;
				} else if (boxScore.lost.tid === t.tid) {
					if (boxScore.overtimes > 0 && otl) {
						t.otl -= 1;
					} else {
						t.lost -= 1;
					}
				}
			}

			await setTeamInfo(t, i, allStars, boxScore);
			t.ptsQtrs = [0];

			for (const stat of resetStatsTeam) {
				if (t.hasOwnProperty(stat)) {
					t[stat] = 0;
				}
			}

			for (let j = 0; j < t.players.length; j++) {
				const p = t.players[j];

				// Fix for players who were hurt this game - don't show right away! And handle players playing through an injury who were injured again.
				if (p.injury.newThisGame) {
					p.injury = p.injuryAtStart
						? {
								...p.injuryAtStart,
								playingThrough: true,
						  }
						: {
								type: "Healthy",
								gamesRemaining: 0,
						  };
				}

				for (const stat of resetStatsPlayer) {
					if (p.hasOwnProperty(stat)) {
						p[stat] = 0;
					}
				}

				if (isSport("basketball")) {
					p.inGame = j < (boxScore.numPlayersOnCourt || 5);
				}
			}
		}

		// Swap teams order, so home team is at bottom in box score
		boxScore.teams.reverse();

		if (boxScore.scoringSummary) {
			for (const event of boxScore.scoringSummary) {
				event.t = event.t === 0 ? 1 : 0;
			}
		}

		// For FBGM, build up scoringSummary from events, to handle deleting a score due to penalty
		if (isSport("football")) {
			boxScore.scoringSummary = [];
		}

		// For confetti
		let finals = false;
		if (boxScore.playoffs && g.get("phase") >= PHASE.PLAYOFFS) {
			const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
			if (playoffSeries) {
				const finalRound = playoffSeries.series.at(-1);
				if (finalRound.length === 1) {
					const finalMatchup = finalRound[0];
					if (
						(finalMatchup.home.tid === boxScore.teams[0].tid &&
							finalMatchup.away?.tid === boxScore.teams[1].tid) ||
						(finalMatchup.home.tid === boxScore.teams[1].tid &&
							finalMatchup.away?.tid === boxScore.teams[0].tid)
					) {
						finals = true;
					}
				}
			}
		}

		return {
			events: inputs.playByPlay,
			finals,
			initialBoxScore: boxScore,
			otl,
			quarterLength: g.get("quarterLength"),
		};
	}
};

export default updatePlayByPlay;
