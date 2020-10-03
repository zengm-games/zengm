import { PLAYER } from "../../../common";
import { draft, league } from "..";
import { idb, iterate } from "../../db";
import { g, helpers } from "../../util";
import type { Conditions, PhaseReturn } from "../../../common/types";

const newPhaseDraft = async (conditions: Conditions): Promise<PhaseReturn> => {
	// Kill off old retired players (done here since not much else happens in this phase change, so making it a little
	// slower is fine). This assumes all killable players have no changes in the cache, which is almost certainly true,
	// but under certain rare cases could cause a minor problem. For performance reasons, this also assumes that any
	// player drafted more than 110 years ago is dead already. If that's not true, congrats on immortality!
	const promises: Promise<any>[] = [];

	await iterate(
		idb.league.transaction("players").store.index("draft.year, retiredYear"),
		IDBKeyRange.bound([g.get("season") - 110], [""]),
		undefined,
		p => {
			// Skip non-retired players and dead players
			if (p.tid !== PLAYER.RETIRED || typeof p.diedYear === "number") {
				return;
			}

			// Formula badly fit to http://www.ssa.gov/oact/STATS/table4c6.html
			const probDeath =
				0.0001165111 * Math.exp(0.0761889274 * (g.get("season") - p.born.year));

			if (Math.random() < probDeath) {
				p.diedYear = g.get("season");
				promises.push(idb.cache.players.put(p)); // Can't await here because of Firefox IndexedDB issues
			}
		},
	);

	await Promise.all(promises);

	await draft.genPlayers(g.get("season"));

	if (g.get("draftType") !== "freeAgents") {
		// Run lottery only if it hasn't been done yet
		const draftLotteryResult = await idb.getCopy.draftLotteryResults({
			season: g.get("season"),
		});

		if (!draftLotteryResult) {
			await draft.genOrder(false, conditions);
		}

		// This is a hack to handle weird cases where already-drafted players have draft.year set to the current season, which fucks up the draft UI
		const players = await idb.cache.players.getAll();

		for (const p of players) {
			if (p.draft.year === g.get("season") && p.tid >= 0) {
				p.draft.year -= 1;
				await idb.cache.players.put(p);
			}
		}
	}

	await league.setGameAttributes({
		otherTeamsWantToHire: false,
	});

	return {
		url:
			g.get("draftType") !== "freeAgents"
				? helpers.leagueUrl(["draft"])
				: undefined,
	};
};

export default newPhaseDraft;
