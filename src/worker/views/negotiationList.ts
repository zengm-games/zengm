import { PLAYER } from "../../common";
import { player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";

const updateNegotiationList = async () => {
	const stats =
		process.env.SPORT === "basketball"
			? ["yearsWithTeam", "gp", "min", "pts", "trb", "ast", "per"]
			: ["yearsWithTeam", "gp", "keyStats", "av"];

	const userTid = g.get("userTid");

	let negotiations = await idb.cache.negotiations.getAll(); // For Multi Team Mode, might have other team's negotiations going on

	negotiations = negotiations.filter(
		negotiation => negotiation.tid === userTid,
	);
	const negotiationPids = negotiations.map(negotiation => negotiation.pid);
	const userPlayersAll = await idb.cache.players.indexGetAll(
		"playersByTid",
		userTid,
	);
	const playersAll = (
		await idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT)
	).filter(p => negotiationPids.includes(p.pid));

	for (const p of playersAll) {
		(p as any).mood = await player.moodInfo(p, userTid);
	}

	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"age",
			"injury",
			"jerseyNumber",
			"watch",
			"contract",
			"draft",
			"latestTransaction",
			"latestTransactionSeason",
			"mood",
		],
		ratings: ["ovr", "pot", "skills", "pos"],
		stats,
		season: g.get("season"),
		tid: userTid,
		showNoStats: true,
		fuzz: true,
	});

	let sumContracts = 0;
	for (const p of players) {
		sumContracts += p.mood.contractAmount;
	}
	sumContracts /= 1000;

	const payroll = await team.getPayroll(userTid);
	const capSpace =
		g.get("salaryCap") > payroll ? (g.get("salaryCap") - payroll) / 1000 : 0;

	const userPlayers = await idb.getCopies.playersPlus(userPlayersAll, {
		attrs: [],
		ratings: ["pos"],
		stats: [],
		season: g.get("season"),
		showNoStats: true,
		showRookies: true,
	});

	return {
		capSpace,
		challengeNoRatings: g.get("challengeNoRatings"),
		hardCap: g.get("hardCap"),
		maxContract: g.get("maxContract"),
		minContract: g.get("minContract"),
		numRosterSpots: g.get("maxRosterSize") - userPlayersAll.length,
		spectator: g.get("spectator"),
		players,
		stats,
		sumContracts,
		userPlayers,
	};
};

export default updateNegotiationList;
