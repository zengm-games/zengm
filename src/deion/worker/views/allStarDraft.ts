import { allStar } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import { GetOutput, UpdateEvents } from "../../common/types";

const stats =
	process.env.SPORT === "basketball" ? ["pts", "trb", "ast"] : ["keyStats"];

const getPlayerInfo = async (pid: number) => {
	const p = await idb.cache.players.get(pid);
	return idb.getCopy.playersPlus(p, {
		attrs: [
			"pid",
			"name",
			"tid",
			"abbrev",
			"injury",
			"watch",
			"age",
			"numAllStar",
		],
		ratings: ["ovr", "skills", "pos"],
		season: g.season,
		stats,
		fuzz: true,
	});
};

const augment = async allStars => {
	const remaining = await Promise.all(
		allStars.remaining.map(({ pid }) => getPlayerInfo(pid)),
	);
	const teams = await Promise.all(
		allStars.teams.map(players =>
			Promise.all(players.map(({ pid }) => getPlayerInfo(pid))),
		),
	);
	return {
		finalized: allStars.finalized,
		remaining,
		teams,
		teamNames: allStars.teamNames,
	};
};

const updateAllStars = async (
	inputs: GetOutput,
	updateEvents: UpdateEvents,
) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement")
	) {
		const nextGameIsAllStar = await allStar.nextGameIsAllStar();

		if (!nextGameIsAllStar) {
			return {
				redirectUrl: helpers.leagueUrl(["all_star_history"]),
			};
		}

		const allStars = await allStar.getOrCreate();
		const { finalized, teams, teamNames, remaining } = await augment(allStars);
		return {
			finalized,
			remaining,
			stats,
			teams,
			teamNames,
			userTids: g.userTids,
		};
	}
};

export default updateAllStars;
