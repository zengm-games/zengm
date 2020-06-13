import type { Player } from "../../../common/types";
import { random, g } from "../../util";
import develop from "./develop";
import generate from "./generate";
import { PLAYER } from "../../../common";
import { idb } from "../../db";

const genRandomFreeAgent = async (): Promise<Player> => {
	for (let i = 0; i < 1000; i++) {
		const age = random.randInt(25, 31);
		const draftYear = g.get("season") - (age - 22);
		const p = generate(PLAYER.FREE_AGENT, age, draftYear, false, 15.5);
		p.ratings[0].season = g.get("season"); // HACK!!!
		await develop(p, 0);
		if (p.ratings[0].ovr <= 40) {
			await idb.cache.players.add(p); // Create pid
			return p as Player;
		}
	}

	throw new Error("genRandomFreeAgent failed");
};

export default genRandomFreeAgent;
