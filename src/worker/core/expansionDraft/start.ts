import { idb } from "../../db";
import { g, helpers, local, updatePlayMenu } from "../../util";
import autoProtect from "./autoProtect";
import { league, draft } from "..";
import { PHASE } from "../../../common";

const start = async () => {
	const expansionDraft = helpers.deepCopy(g.get("expansionDraft"));

	if (
		g.get("phase") !== PHASE.EXPANSION_DRAFT ||
		expansionDraft.phase !== "protection"
	) {
		throw new Error("Invalid expansion draft phase");
	}

	local.fantasyDraftResults = [];

	const userTids = g.get("userTids");

	const protectedPids: number[] = [];
	for (const [tidString, pids] of Object.entries(
		expansionDraft.protectedPids,
	)) {
		const tid = parseInt(tidString);
		if (userTids.includes(tid) && !local.autoPlayUntil && !g.get("spectator")) {
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
	await draft.genOrderFantasy(expansionDraft.expansionTids, "expansion");

	await league.setGameAttributes({
		expansionDraft: {
			phase: "draft",
			expansionTids: expansionDraft.expansionTids,
			availablePids,
		},
	});

	await updatePlayMenu();
};

export default start;
