import { PLAYER } from "../../common/constants.ts";
import { team } from "../core/index.ts";
import { idb } from "../db/index.ts";
import { g } from "../util/index.ts";
import addFirstNameShort from "../util/addFirstNameShort.ts";
import { addMood, freeAgentStats } from "./freeAgents.ts";
import { defineView } from "../util/defineView.ts";

export const getNegotiationPids = async (tid: number) => {
	const negotiations = await idb.cache.negotiations.getAll();

	// Need to check tid for Multi Team Mode, might have other team's negotiations going on
	return new Set(
		negotiations
			.filter((negotiation) => negotiation.tid === tid)
			.map((negotiation) => negotiation.pid),
	);
};

export default defineView({
	id: "negotiationList",
	load: async () => {
		const stats = ["yearsWithTeam", ...freeAgentStats] as const;

		const userTid = g.get("userTid");

		const negotiationPids = await getNegotiationPids(userTid);

		const userPlayersAll = await idb.cache.players.indexGetAll(
			"playersByTid",
			userTid,
		);
		const playersAll = (
			await idb.cache.players.indexGetAll("playersByTid", PLAYER.FREE_AGENT)
		).filter((p) => negotiationPids.has(p.pid));

		const playersFiltered = await idb.getCopies.playersPlus(playersAll, {
			attrs: [
				"pid",
				"name",
				"tid",
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
				"lastSalary",
			],
			ratings: ["ovr", "pot", "skills", "pos"],
			stats,
			season: g.get("season"),
			tid: userTid,
			showNoStats: true,
			fuzz: true,
		});

		const players = addFirstNameShort(
			await addMood(playersFiltered, playersAll),
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
			draftPickAutoContract: g.get("draftPickAutoContract"),
			numRosterSpots: g.get("maxRosterSize") - userPlayersAll.length,
			payroll: payroll / 1000,
			players,
			stats,
			sumContracts,
			userPlayers,
		};
	},
});
