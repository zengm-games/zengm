import { player, team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g, helpers } from "../util/index.ts";
import {
	makeAbbrevsUnique,
	setTeamInfo,
	type TeamSeasonOverride,
} from "./gameLog.ts";
import type {
	AllStars,
	Game,
	UpdateEvents,
	ViewInput,
} from "../../common/types.ts";
import { PHASE, STARTING_NUM_TIMEOUTS } from "../../common/constants.ts";
import { formatClock } from "../../common/formatClock.ts";
import { getPeriodName } from "../../common/getPeriodName.ts";
import { bySport } from "../../common/bySport.ts";
import { isSport } from "../../common/isSport.ts";

export const boxScoreToLiveSim = async ({
	allStars,
	boxScore,
	confetti,
	playByPlay,
	teamSeasonOverrides,
}: {
	allStars: AllStars | undefined;
	boxScore: Game;
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

	const initialBoxScore: any = boxScore;

	if (isSport("basketball")) {
		resetStatsTeam.push("ba");

		initialBoxScore.elam = allStars ? g.get("elamASG") : g.get("elam");
		initialBoxScore.elamOvertime = g.get("elamOvertime");
	}

	initialBoxScore.overtime = "";
	initialBoxScore.quarter = "";

	// Initialize quarterShort so there is something to display immediately
	initialBoxScore.quarterShort = bySport({
		baseball: "1",
		default:
			initialBoxScore.numPeriods === 0
				? "OT"
				: `${getPeriodName(initialBoxScore.numPeriods, true)}1`,
	});

	// Basketball clock is in seconds
	const clock = isSport("basketball")
		? g.get("quarterLength") * 60
		: g.get("quarterLength");
	initialBoxScore.time = formatClock(clock);
	initialBoxScore.gameOver = false;
	delete initialBoxScore.shootout;

	for (const i of [0, 1] as const) {
		const t = initialBoxScore.teams[i];

		// Fix records, taking out result of this game
		// Keep in sync with LiveGame.tsx
		if (initialBoxScore.playoffs) {
			if (t.playoffs) {
				if (initialBoxScore.won.tid === t.tid) {
					t.playoffs.won -= 1;
				} else if (initialBoxScore.lost.tid === t.tid) {
					t.playoffs.lost -= 1;
				}
			}
		} else {
			if (
				initialBoxScore.won.pts === initialBoxScore.lost.pts &&
				initialBoxScore.won.sPts === initialBoxScore.lost.sPts
			) {
				// Tied!
				if (t.tied !== undefined) {
					t.tied -= 1;
				}
			} else if (initialBoxScore.won.tid === t.tid) {
				t.won -= 1;
			} else if (initialBoxScore.lost.tid === t.tid) {
				if (initialBoxScore.overtimes > 0 && otl) {
					t.otl -= 1;
				} else {
					t.lost -= 1;
				}
			}
		}

		await setTeamInfo(
			t,
			i,
			allStars,
			initialBoxScore,
			teamSeasonOverrides?.[i],
		);
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
	makeAbbrevsUnique(initialBoxScore.teams);

	// Swap teams order, so home team is at bottom in box score
	initialBoxScore.teams.reverse();

	// For FBGM, build up scoringSummary from events, to handle deleting a score due to penalty
	if (
		bySport({
			baseball: true,
			basketball: false,
			football: true,
			hockey: true,
		})
	) {
		initialBoxScore.scoringSummary = [];
	}

	if (STARTING_NUM_TIMEOUTS !== undefined) {
		initialBoxScore.teams[0].timeouts = STARTING_NUM_TIMEOUTS;
		initialBoxScore.teams[1].timeouts = STARTING_NUM_TIMEOUTS;
	}

	return {
		confetti,
		events: playByPlay,
		initialBoxScore,
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
		const boxScore = await idb.getCopy.games({ gid: inputs.gid });

		if (!boxScore) {
			throw new Error("Invalid gid");
		}

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
		if (
			boxScore.playoffs &&
			boxScore.numGamesToWinSeries !== undefined &&
			g.get("phase") >= PHASE.PLAYOFFS
		) {
			const playoffSeries = await idb.cache.playoffSeries.get(g.get("season"));
			if (playoffSeries) {
				const finalRound = playoffSeries.series.at(-1);
				if (finalRound?.length === 1) {
					const finalMatchup = finalRound[0]!;
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
