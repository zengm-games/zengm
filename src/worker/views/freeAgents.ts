import { PLAYER } from "../../common";
import { freeAgents, player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";

const updateFreeAgents = async () => {
	const payroll = await team.getPayroll(g.get("userTid"));
	const [userPlayersAll, playersAll] = await Promise.all([
		idb.cache.players.indexGetAll("playersByTid", g.get("userTid")),
		idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT),
	]);
	const capSpace =
		g.get("salaryCap") > payroll ? (g.get("salaryCap") - payroll) / 1000 : 0;
	const stats =
		process.env.SPORT === "basketball"
			? ["min", "pts", "trb", "ast", "per"]
			: ["gp", "keyStats", "av"];
	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"age",
			"contract",
			"freeAgentMood",
			"injury",
			"watch",
		],
		ratings: ["ovr", "pot", "skills", "pos"],
		stats,
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
		fuzz: true,
		oldStats: true,
	});

	const userPlayers = await idb.getCopies.playersPlus(userPlayersAll, {
		attrs: [],
		ratings: ["pos"],
		stats: [],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
	});

	for (const p of players) {
		p.contract.amount = freeAgents.amountWithMood(
			p.contract.amount,
			p.freeAgentMood[g.get("userTid")],
		);
		p.mood = player.moodColorText(p);
	}

	return {
		capSpace,
		challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
		challengeNoRatings: g.get("challengeNoRatings"),
		hardCap: g.get("hardCap"),
		maxContract: g.get("maxContract"),
		minContract: g.get("minContract"),
		numRosterSpots: g.get("maxRosterSize") - userPlayers.length,
		observer: g.get("observer"),
		phase: g.get("phase"),
		players,
		playersRefuseToNegotiate: g.get("playersRefuseToNegotiate"),
		salaryCap: g.get("salaryCap"),
		stats,
		userPlayers,
		userTid: g.get("userTid"),
	};
};

export default updateFreeAgents;
