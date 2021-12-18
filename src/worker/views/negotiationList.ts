import { bySport, PLAYER } from "../../common";
import { team } from "../core";
import { idb } from "../db";
import { g } from "../util";
import { addMood } from "./freeAgents";
import { TableConfig } from "../../ui/util/TableConfig";

const updateNegotiationList = async () => {
	const stats = bySport({
		basketball: [
			"stat:gp",
			"stat:min",
			"stat:pts",
			"stat:trb",
			"stat:ast",
			"stat:per",
		],
		football: ["stat:gp", "stat:keyStats", "stat:av"],
		hockey: ["stat:gp", "stat:keyStats", "stat:ops", "stat:dps", "stat:ps"],
	});

	const config: TableConfig = new TableConfig("negotiationList", [
		"Name",
		"Pos",
		"Age",
		"Ovr",
		"Pot",
		"stat:yearsWithTeam",
		...stats,
		"Acquired",
		"Mood",
		"Asking For",
		"Exp",
	]);
	await config.load();

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
	const playersAll = await addMood(
		(
			await idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT)
		).filter(p => negotiationPids.includes(p.pid)),
	);

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
		ratings: config.ratingsNeeded,
		stats: config.statsNeeded,
		season: g.get("season"),
		tid: userTid,
		showNoStats: true,
		fuzz: true,
	});

	let sumContracts = 0;
	for (const p of players) {
		sumContracts += p.mood.user.contractAmount;
	}
	sumContracts /= 1000;

	const payroll = await team.getPayroll(userTid);
	const capSpace = (g.get("salaryCap") - payroll) / 1000;

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
		config,
		sumContracts,
		userPlayers,
	};
};

export default updateNegotiationList;
