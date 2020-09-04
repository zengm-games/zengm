import { g, helpers } from "../util";
import { idb } from "../db";

const updateProtectPlayers = async () => {
	const expansionDraft = g.get("expansionDraft");
	if (expansionDraft.phase === "setup") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["expansion_draft"]),
		};
		return returnValue;
	} else if (expansionDraft.phase === "draft") {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["draft"]),
		};
		return returnValue;
	} else if (
		expansionDraft.phase === "protection" &&
		expansionDraft.allowSwitchTeam
	) {
		// https://stackoverflow.com/a/59923262/786644
		const returnValue = {
			redirectUrl: helpers.leagueUrl(["new_team"]),
		};
		return returnValue;
	}

	const stats =
		process.env.SPORT === "basketball"
			? ["yearsWithTeam", "gp", "min", "pts", "trb", "ast", "per"]
			: ["yearsWithTeam", "gp", "keyStats", "av"];

	let players: any[] = [];
	const expansionTeam = expansionDraft.expansionTids.includes(g.get("userTid"));

	if (!expansionTeam) {
		// User's team is not an expansion team, so get players to display
		const playersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			g.get("userTid"),
		);
		players = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"age",
				"injury",
				"watch",
				"contract",
				"draft",
				"latestTransaction",
				"latestTransactionSeason",
				"jerseyNumber",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.get("season"),
			tid: g.get("userTid"),
			showNoStats: true,
			fuzz: true,
		});
	}

	return {
		challengeNoRatings: g.get("challengeNoRatings"),
		expansionDraft,
		expansionTeam,
		nextPhase: g.get("nextPhase"),
		spectator: g.get("spectator"),
		players,
		stats,
		userTid: g.get("userTid"),
		userTids: g.get("userTids"),
	};
};

export default updateProtectPlayers;
