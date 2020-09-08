import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player, team } from "..";
import { idb } from "../../db";
import { g, helpers } from "../../util";

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
			player.generate(PLAYER.FREE_AGENT, 30, 2017, true, 15.5),
			player.generate(PLAYER.FREE_AGENT, 30, 2017, true, 15.5),

			// Non free agent
			player.generate(12, 30, 2017, true, 15.5),

			// User's team - 14 players
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
			player.generate(g.get("userTid"), 30, 2017, true, 15.5),
		],
		teams,
	});
};

export { beforeTests, givePlayerMinContract };
