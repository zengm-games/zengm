import { allStar } from "../core";
import { idb } from "../db";
import { g, helpers } from "../util";
import type { UpdateEvents, AllStars } from "../../common/types";

const stats =
	process.env.SPORT === "basketball" ? ["pts", "trb", "ast"] : ["keyStats"];

const getPlayerInfo = async (pid: number) => {
	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("Invalid pid");
	}

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
		season: g.get("season"),
		stats: [...stats, "jerseyNumber"],
		fuzz: true,
	});
};

const augment = async (allStars: AllStars) => {
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

const updateAllStars = async (inputs: unknown, updateEvents: UpdateEvents) => {
	if (
		updateEvents.includes("firstRun") ||
		updateEvents.includes("gameSim") ||
		updateEvents.includes("playerMovement")
	) {
		const nextGameIsAllStar = await allStar.nextGameIsAllStar();

		if (!nextGameIsAllStar) {
			// https://stackoverflow.com/a/59923262/786644
			const returnValue = {
				redirectUrl: helpers.leagueUrl(["all_star_history"]),
			};
			return returnValue;
		}

		const allStars = await allStar.getOrCreate();
		const { finalized, teams, teamNames, remaining } = await augment(allStars);

		return {
			challengeNoRatings: g.get("challengeNoRatings"),
			finalized,
			remaining,
			spectator: g.get("spectator"),
			stats,
			teams,
			teamNames,
			userTids: g.get("userTids"),
		};
	}
};

export default updateAllStars;
