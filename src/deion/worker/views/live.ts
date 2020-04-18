import { allStar, season } from "../core";
import { g, helpers, lock } from "../util";
import type { UpdateEvents } from "../../common/types";

const updateGamesList = async () => {
	const games = helpers.deepCopy(await season.getSchedule(true));

	const games2 = await Promise.all(
		games.map(async game => {
			let highlight;
			let awayRegion;
			let awayName;
			let homeRegion;
			let homeName;
			if (game.awayTid === -2 && game.homeTid === -1) {
				// Special case for All-Star Game
				const allStars = await allStar.getOrCreate();
				highlight = false;
				awayRegion = "Team";
				awayName = allStars.teamNames[1].replace("Team ", "");
				homeRegion = "Team";
				homeName = allStars.teamNames[0].replace("Team ", "");
			} else {
				if (
					game.awayTid === g.get("userTid") ||
					game.homeTid === g.get("userTid")
				) {
					highlight = true;
				} else {
					highlight = false;
				}

				awayRegion = g.get("teamRegionsCache")[game.awayTid];
				awayName = g.get("teamNamesCache")[game.awayTid];
				homeRegion = g.get("teamRegionsCache")[game.homeTid];
				homeName = g.get("teamNamesCache")[game.homeTid];
			}

			return {
				...game,
				highlight,
				awayRegion,
				awayName,
				homeRegion,
				homeName,
			};
		}),
	);

	return {
		games: games2,
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
