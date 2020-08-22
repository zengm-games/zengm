import { PLAYER, PHASE } from "../../common";
import { freeAgents, player, team } from "../core";
import { idb } from "../db";
import { g } from "../util";

const updateNegotiationList = async () => {
	const stats =
		process.env.SPORT === "basketball"
			? ["yearsWithTeam", "gp", "min", "pts", "trb", "ast", "per"]
			: ["yearsWithTeam", "gp", "keyStats", "av"];
	let negotiations = await idb.cache.negotiations.getAll(); // For Multi Team Mode, might have other team's negotiations going on

	negotiations = negotiations.filter(
		negotiation => negotiation.tid === g.get("userTid"),
	);
	const negotiationPids = negotiations.map(negotiation => negotiation.pid);
	const userPlayersAll = await idb.cache.players.indexGetAll(
		"playersByTid",
		g.get("userTid"),
	);
	const playersAll = (
		await idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT)
	).filter(p => negotiationPids.includes(p.pid));
	const players = await idb.getCopies.playersPlus(playersAll, {
		attrs: [
			"pid",
			"name",
			"age",
			"freeAgentMood",
			"injury",
			"watch",
			"contract",
			"draft",
			"latestTransaction",
			"latestTransactionSeason",
		],
		ratings: ["ovr", "pot", "skills", "pos"],
		stats,
		season: g.get("season"),
		tid: g.get("userTid"),
		showNoStats: true,
		fuzz: true,
	});
	let sumContracts = 0;

	for (const p of players) {
		// Can use g.get("userTid") instead of neogtiation.tid because only user can view this page
		p.contract.amount = freeAgents.amountWithMood(
			p.contract.amount,
			p.freeAgentMood[g.get("userTid")],
		);
		p.mood = player.moodColorText(p);
		sumContracts += p.contract.amount;
	}

	const payroll = await team.getPayroll(g.get("userTid"));
	const capSpace =
		g.get("salaryCap") > payroll ? (g.get("salaryCap") - payroll) / 1000 : 0;

	let playersRefuseToNegotiate = g.get("playersRefuseToNegotiate");

	if (g.get("phase") === PHASE.RESIGN_PLAYERS) {
		const t = await idb.cache.teams.get(g.get("userTid"));
		if (
			t &&
			t.firstSeasonAfterExpansion !== undefined &&
			t.firstSeasonAfterExpansion - 1 === g.get("season")
		) {
			playersRefuseToNegotiate = false;
		}
	}

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
		challengeNoFreeAgents: g.get("challengeNoFreeAgents"),
		challengeNoRatings: g.get("challengeNoRatings"),
		hardCap: g.get("hardCap"),
		maxContract: g.get("maxContract"),
		minContract: g.get("minContract"),
		numRosterSpots: g.get("maxRosterSize") - userPlayersAll.length,
		observer: g.get("observer"),
		phase: g.get("phase"),
		players,
		playersRefuseToNegotiate,
		salaryCap: g.get("salaryCap"),
		season: g.get("season"),
		stats,
		sumContracts,
		userPlayers,
		userTid: g.get("userTid"),
	};
};

export default updateNegotiationList;
