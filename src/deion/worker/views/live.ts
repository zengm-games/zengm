import { allStar, season } from "../core";
import { g, helpers, lock } from "../util";
import { UpdateEvents } from "../../common/types";

const updateGamesList = async () => {
	const games: any[] = helpers.deepCopy(await season.getSchedule(true));

	for (const game of games) {
		if (game.awayTid === -2 && game.homeTid === -1) {
			// Special case for All-Star Game
			const allStars = await allStar.getOrCreate();
			game.highlight = false;
			game.awayRegion = "Team";
			game.awayName = allStars.teamNames[1].replace("Team ", "");
			game.homeRegion = "Team";
			game.homeName = allStars.teamNames[0].replace("Team ", "");
		} else {
			if (
				game.awayTid === g.get("userTid") ||
				game.homeTid === g.get("userTid")
			) {
				game.highlight = true;
			} else {
				game.highlight = false;
			}

			game.awayRegion = g.get("teamRegionsCache")[game.awayTid];
			game.awayName = g.get("teamNamesCache")[game.awayTid];
			game.homeRegion = g.get("teamRegionsCache")[game.homeTid];
			game.homeName = g.get("teamNamesCache")[game.homeTid];
		}
	}

	return {
		games,
	};
};

const updateGamesInProgress = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("lock.gameSim")) {
		return {
			gamesInProgress: lock.get("gameSim"),
		};
	}
};

export default async (inputs: unknown, updateEvents: UpdateEvents) => {
	return Object.assign(
		{},
		await updateGamesList(),
		await updateGamesInProgress(inputs, updateEvents),
	);
};
