import { PLAYER } from "../../../common/index.ts";
import testHelpers from "../../../test/helpers.ts";
import { player, team } from "../index.ts";
import { idb } from "../../db/index.ts";
import { g, helpers } from "../../util/index.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";

// Make player ask for a min contract, to ensure he'll never refuse to sign
const givePlayerMinContract = async (pid: number) => {
	const p = await idb.cache.players.get(pid);
	if (!p) {
		throw new Error("Invalid pid");
	}
	p.contract.amount = g.get("minContract");
	await idb.cache.players.put(p);
};

const beforeTests = async () => {
	testHelpers.resetG();

	const teamsDefault = helpers.getTeamsDefault().slice(0, 3);
	const teams = teamsDefault.map(team.generate);

	await testHelpers.resetCache({
		players: [
			// Free agents
			player.generate(PLAYER.FREE_AGENT, 30, 2017, true, DEFAULT_LEVEL),
			player.generate(PLAYER.FREE_AGENT, 30, 2017, true, DEFAULT_LEVEL),

			// Non free agent
			player.generate(12, 30, 2017, true, DEFAULT_LEVEL),

			// User's team - 14 players
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
			player.generate(g.get("userTid"), 30, 2017, true, DEFAULT_LEVEL),
		],
		teams,
	});
};

export { beforeTests, givePlayerMinContract };
