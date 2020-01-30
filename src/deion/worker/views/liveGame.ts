import { idb } from "../db";
import { g, helpers, overrides } from "../util";
import { setTeamInfo } from "./gameLog";
import { UpdateEvents, ViewInput } from "../../common/types";

const updatePlayByPlay = async (
	inputs: ViewInput<"liveGame">,
	updateEvents: UpdateEvents,
) => {
	const redirectToMenu = {
		redirectUrl: helpers.leagueUrl(["live"]),
	};

	if (updateEvents.includes("firstRun") && !inputs.fromAction) {
		return redirectToMenu;
	}

	if (
		inputs.gidPlayByPlay !== undefined &&
		inputs.playByPlay !== undefined &&
		inputs.playByPlay.length > 0
	) {
		const boxScore: any = helpers.deepCopy(
			await idb.cache.games.get(inputs.gidPlayByPlay),
		);

		// Stats to set to 0
		const resetStatsPlayer = overrides.core.player.stats!.raw;
		const resetStatsTeam = overrides.core.team.stats!.raw;
		const allStarGame =
			boxScore.teams[0].tid === -1 || boxScore.teams[1].tid === -1;
		let allStars;

		if (allStarGame) {
			allStars = await idb.cache.allStars.get(g.get("season"));

			if (!allStars) {
				return redirectToMenu;
			}
		}

		boxScore.overtime = "";
		boxScore.quarter = "1st quarter";
		boxScore.time = `${g.get("quarterLength")}:00`;
		boxScore.gameOver = false;

		for (let i = 0; i < boxScore.teams.length; i++) {
			const t = boxScore.teams[i];
			setTeamInfo(t, i, allStars, boxScore);
			t.ptsQtrs = [0];

			for (const stat of resetStatsTeam) {
				if (t.hasOwnProperty(stat)) {
					t[stat] = 0;
				}
			}

			for (let j = 0; j < t.players.length; j++) {
				const p = t.players[j]; // Fix for players who were hurt this game - don't show right away!

				if (p.injury.type !== "Healthy" && p.min > 0) {
					p.injury = {
						type: "Healthy",
						gamesRemaining: 0,
					};
				}

				for (const stat of resetStatsPlayer) {
					if (p.hasOwnProperty(stat)) {
						p[stat] = 0;
					}
				}

				if (process.env.SPORT === "basketball") {
					p.inGame = j < 5;
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

		return {
			initialBoxScore: boxScore,
			events: inputs.playByPlay,
		};
	}
};

export default updatePlayByPlay;
