import { PLAYER } from "../../../common";
import testHelpers from "../../../test/helpers";
import { player } from "..";
import { idb } from "../../db";
import { g } from "../../util";

// Make player ask for a min contract, to ensure he'll never refuse to sign
const givePlayerMinContract = async pid => {
    const p = await idb.cache.players.get(pid);
    p.contract.amount = g.minContract;
    await idb.cache.players.put(p);
};

const beforeTests = async () => {
    testHelpers.resetG();

    await testHelpers.resetCache({
        players: [
            // Free agents
            player.generate(PLAYER.FREE_AGENT, 30, 2017, true, 15.5),
            player.generate(PLAYER.FREE_AGENT, 30, 2017, true, 15.5),

            // Non free agent
            player.generate(12, 30, 2017, true, 15.5),

            // User's team - 14 players
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
            player.generate(g.userTid, 30, 2017, true, 15.5),
        ],
    });
};

export { beforeTests, givePlayerMinContract };
