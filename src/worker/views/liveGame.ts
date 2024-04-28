import { player, team } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import {
	makeAbbrevsUnique,
	setTeamInfo,
	type TeamSeasonOverride,
} from "./gameLog";
import type { AllStars, UpdateEvents, ViewInput } from "../../common/types";
import { bySport, isSport, PHASE, STARTING_NUM_TIMEOUTS } from "../../common";

export const boxScoreToLiveSim = async ({
	allStars,
	boxScore,
	confetti,
	playByPlay,
	teamSeasonOverrides,
}: {
	allStars: AllStars | undefined;
	boxScore: any;
	confetti: boolean;
	playByPlay: any[];
	teamSeasonOverrides?: [TeamSeasonOverride, TeamSeasonOverride];
}) => {
	const otl = g.get("otl", "current");

	// Stats to set to 0
	const resetStatsPlayer = [...player.stats.raw];
	if (player.stats.byPos) {
		resetStatsPlayer.push(...player.stats.byPos);
	}
	const resetStatsTeam = [...team.stats.raw];
	if (team.stats.byPos) {
		resetStatsTeam.push(...team.stats.byPos);
	}

	if (isSport("basketball")) {
		boxScore.elam = allStars ? g.get("elamASG") : g.get("elam");
		boxScore.elamOvertime = g.get("elamOvertime");
	}

	boxScore.overtime = "";
	boxScore.quarter = "";
	boxScore.quarterShort = "";
	boxScore.time = `${g.get("quarterLength")}:00`;
	boxScore.gameOver = false;
	delete boxScore.shootout;

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
			if (
				boxScore.won.pts === boxScore.lost.pts &&
				boxScore.won.sPts === boxScore.lost.sPts
			) {
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

		await setTeamInfo(t, i, allStars, boxScore, teamSeasonOverrides?.[i]);
		t.ptsQtrs = [];

		for (const stat of resetStatsTeam) {
			if (Object.hasOwn(t, stat)) {
				t[stat] = 0;
			}
		}

		// Special reset of shootout stats to undefined, since that is used in the UI to identify if we're in a shootout yet
		delete t.sPts;
		delete t.sAtt;

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
				if (Object.hasOwn(p, stat)) {
					p[stat] = 0;
				}
			}
		}
	}
	makeAbbrevsUnique(boxScore.teams);

	// Swap teams order, so home team is at bottom in box score
	boxScore.teams.reverse();

	// For FBGM, build up scoringSummary from events, to handle deleting a score due to penalty
	if (
		bySport({
			baseball: true,
			basketball: false,
			football: true,
			hockey: true,
		})
	) {
		boxScore.scoringSummary = [];
	}

	if (STARTING_NUM_TIMEOUTS !== undefined) {
		boxScore.teams[0].timeouts = STARTING_NUM_TIMEOUTS;
		boxScore.teams[1].timeouts = STARTING_NUM_TIMEOUTS;
	}

	return {
		confetti,
		events: playByPlay,
		initialBoxScore: boxScore,
		otl,
		quarterLength: g.get("quarterLength"),
	};
};

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

		const allStarGame =
			boxScore.teams[0].tid === -1 || boxScore.teams[1].tid === -1;
		let allStars;

		if (allStarGame) {
			allStars = await idb.cache.allStars.get(g.get("season"));

			if (!allStars) {
				return redirectToMenu;
			}
		}

		let confetti = false;
		if (boxScore.playoffs && g.get("phase") >= PHASE.PLAYOFFS) {
			const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
			if (playoffSeries) {
				const finalRound = playoffSeries.series.at(-1);
				if (finalRound?.length === 1) {
					const finalMatchup = finalRound[0];
					if (
						(finalMatchup.home.tid === boxScore.teams[0].tid &&
							finalMatchup.away?.tid === boxScore.teams[1].tid) ||
						(finalMatchup.home.tid === boxScore.teams[1].tid &&
							finalMatchup.away?.tid === boxScore.teams[0].tid)
					) {
						const maxWon = Math.max(
							finalMatchup.home.won,
							finalMatchup.away?.won ?? 0,
						);
						if (maxWon >= boxScore.numGamesToWinSeries) {
							confetti = true;
						}
					}
				}
			}
		}

		return boxScoreToLiveSim({
			allStars,
			boxScore,
			confetti,
			playByPlay: inputs.playByPlay,
		});
	}
};

export default updatePlayByPlay;
