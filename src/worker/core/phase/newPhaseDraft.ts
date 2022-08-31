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
	const promises: Promise<unknown>[] = [];

	const currentSeason = g.get("season");
	await iterate(
		idb.league.transaction("players").store.index("draft.year, retiredYear"),
		IDBKeyRange.bound([currentSeason - 110], [""]),
		undefined,
		p => {
			// Skip non-retired players and dead players
			if (p.tid !== PLAYER.RETIRED || typeof p.diedYear === "number") {
				return;
			}

			// Skip real players dying young
			if (p.real && currentSeason - p.born.year < 70) {
				return;
			}

			// Formula badly fit to http://www.ssa.gov/oact/STATS/table4c6.html
			const probDeath =
				0.0001165111 * Math.exp(0.0761889274 * (currentSeason - p.born.year));

			if (Math.random() < probDeath) {
				p.diedYear = currentSeason;
				promises.push(idb.cache.players.put(p));
			}
		},
	);

	await Promise.all(promises);

	await draft.genPlayers(currentSeason);

	if (g.get("draftType") !== "freeAgents") {
		// Run lottery only if it hasn't been done yet
		const draftLotteryResult = await idb.getCopy.draftLotteryResults(
			{
				season: currentSeason,
			},
			"noCopyCache",
		);

		if (!draftLotteryResult) {
			try {
				await draft.genOrder(false, conditions);
			} catch (error) {
				if (!(error as any).notEnoughTeams) {
					throw error;
				}

				// If not enough teams, do no lottery
				await draft.genOrder(false, conditions, "noLottery");
			}
		}

		// This is a hack to handle weird cases where already-drafted players have draft.year set to the current season, which fucks up the draft UI
		const players = await idb.cache.players.getAll();

		for (const p of players) {
			if (p.draft.year === currentSeason && p.tid >= 0) {
				p.draft.year -= 1;
				await idb.cache.players.put(p);
			}
		}
	}

	await league.setGameAttributes({
		otherTeamsWantToHire: false,
	});

	let redirect;
	if (g.get("draftType") !== "freeAgents") {
		redirect = {
			url: helpers.leagueUrl(["draft"]),
			text: "View the draft",
		};
	}

	return {
		redirect,
	};
};

export default newPhaseDraft;
