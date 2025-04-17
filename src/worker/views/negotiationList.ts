import { PLAYER } from "../../common/index.ts";
import { team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { addMood, freeAgentStats } from "./freeAgents.ts";

export const getNegotiationPids = async (tid: number) => {
	const negotiations = await idb.cache.negotiations.getAll();

	// Need to check tid for Multi Team Mode, might have other team's negotiations going on
	return new Set(
		negotiations
			.filter((negotiation) => negotiation.tid === tid)
			.map((negotiation) => negotiation.pid),
	);
};

const updateNegotiationList = async () => {
	const stats = ["yearsWithTeam", ...freeAgentStats];

	const userTid = g.get("userTid");

	const negotiationPids = await getNegotiationPids(userTid);

	const userPlayersAll = await idb.cache.players.indexGetAll(
		"playersByTid",
		userTid,
	);
	const playersAll = await addMood(
		(
			await idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT)
		).filter((p) => negotiationPids.has(p.pid)),
	);

	const players = addFirstNameShort(
		await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"firstName",
				"lastName",
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
		}),
	);

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
		draftPickAutoContract: g.get("draftPickAutoContract"),
		luxuryPayroll: g.get("luxuryPayroll") / 1000,
		salaryCapType: g.get("salaryCapType"),
		maxContract: g.get("maxContract"),
		minContract: g.get("minContract"),
		numRosterSpots: g.get("maxRosterSize") - userPlayersAll.length,
		spectator: g.get("spectator"),
		payroll: payroll / 1000,
		players,
		season: g.get("season"),
		stats,
		sumContracts,
		userPlayers,
	};
};

export default updateNegotiationList;
