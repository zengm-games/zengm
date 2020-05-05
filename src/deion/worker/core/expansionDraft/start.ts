import { idb } from "../../db";
import { g, helpers, local } from "../../util";
import autoProtect from "./autoProtect";
import { league } from "..";

const start = async () => {
	const expansionDraft = helpers.deepCopy(g.get("expansionDraft"));

	if (expansionDraft.phase !== "protection") {
		throw new Error("Invalid expansion draft phase");
	}

	const userTids = g.get("userTids");

	const protectedPids: number[] = [];
	for (const [tidString, pids] of Object.entries(
		expansionDraft.protectedPids,
	)) {
		const tid = parseInt(tidString);
		if (userTids.includes(tid) && local.autoPlaySeasons === 0) {
			protectedPids.push(...pids);
		} else {
			const autoPids = await autoProtect(tid);
			protectedPids.push(...autoPids);
		}
	}

	const availablePids = (
		await idb.cache.players.indexGetAll("playersByTid", [0, Infinity])
	)
		.filter(p => !protectedPids.includes(p.pid))
		.map(p => p.pid);

	// Move draft picks around, like fantasy draft

	await league.setGameAttributes({
		expansionDraft: {
			phase: "draft",
			availablePids,
		},
	});
};

export default start;
