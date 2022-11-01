import { idb } from "../../db";
import { g, local } from "../../util";
import type { OwnerMood } from "../../../common/types";
import { bySport } from "../../../common";

/**
 * Update teamSeason.ownerMood based on performance this season, only for user's team.
 *
 * This is based on three factors: regular season performance, playoff performance, and finances. Designed to be called after the playoffs end.
 *
 * @memberOf core.season
 * @return {Promise.Object} Resolves to an object containing the changes in teamSeason.ownerMood this season.
 */
const updateOwnerMood = async (): Promise<
	| {
			cappedDeltas: OwnerMood;
			deltas: OwnerMood;
	  }
	| undefined
> => {
	// If auto play seasons or multi team mode, no messages - keep in sync with genMessage
	if (
		local.autoPlayUntil ||
		g.get("spectator") ||
		g.get("userTids").length > 1
	) {
		return;
	}

	const t = await idb.getCopy.teamsPlus(
		{
			seasonAttrs: ["won", "playoffRoundsWon", "profit"],
			season: g.get("season"),
			tid: g.get("userTid"),
		},
		"noCopyCache",
	);

	if (!t) {
		return;
	}

	const teamSeason = await idb.cache.teamSeasons.indexGet(
		"teamSeasonsByTidSeason",
		[g.get("userTid"), g.get("season")],
	);

	if (!teamSeason) {
		return;
	}

	const salaryCapFactor =
		g.get("salaryCap") /
		bySport({
			// defaultGameAttributes.salaryCap, but frozen in time because otherwise various coefficients below would need to be updated when it changes
			baseball: 175000,
			basketball: 90000,
			football: 200000,
			hockey: 80000,
		});

	const expectedProfit = 15 * salaryCapFactor;

	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;

	// Some sports are more random than others, so like a 60% winning percentage is more impressive then. I think it only matters a lot for baseball, so I picked that coeffiient by determining what factor is needed to make 110/162 wins as valuable as 70/82 wins, then adding a little more so like 95 win seasons are still pretty good.
	const winsFactor = bySport({
		baseball: 2.2,
		basketball: 1,
		football: 1,
		hockey: 1,
	});

	const deltas = {
		wins:
			(winsFactor * (0.25 * (t.seasonAttrs.won - g.get("numGames") / 2))) /
			(g.get("numGames") / 2),
		playoffs: 0,
		money: g.get("budget")
			? (t.seasonAttrs.profit - expectedProfit) / (100 * salaryCapFactor)
			: 0,
	};

	if (t.seasonAttrs.playoffRoundsWon < 0) {
		deltas.playoffs = -0.2;
	} else if (t.seasonAttrs.playoffRoundsWon < numPlayoffRounds) {
		deltas.playoffs =
			(0.16 / numPlayoffRounds) * t.seasonAttrs.playoffRoundsWon;
	} else {
		deltas.playoffs = 0.2;
	}

	if (!teamSeason.ownerMood) {
		teamSeason.ownerMood = (g as any).ownerMood
			? (g as any).ownerMood
			: {
					money: 0,
					playoffs: 0,
					wins: 0,
			  };
	}

	// This is just for TypeScript
	const ownerMood = teamSeason.ownerMood;
	if (!ownerMood) {
		throw new Error("Should never happen");
	}

	// Bound only the top - can't win the game by doing only one thing, but you can lose it by neglecting one thing
	const cappedDeltas = { ...deltas };

	if (ownerMood.money + cappedDeltas.money > 1) {
		cappedDeltas.money = 1 - ownerMood.money;
	}

	if (ownerMood.playoffs + cappedDeltas.playoffs > 1) {
		cappedDeltas.playoffs = 1 - ownerMood.playoffs;
	}

	if (ownerMood.wins + cappedDeltas.wins > 1) {
		cappedDeltas.wins = 1 - ownerMood.wins;
	}

	// Only update owner mood if grace period is over
	if (g.get("season") >= g.get("gracePeriodEnd") && !g.get("godMode")) {
		// Bound only the top - can't win the game by doing only one thing, but you can lose it by neglecting one thing
		ownerMood.money += cappedDeltas.money;
		ownerMood.playoffs += cappedDeltas.playoffs;
		ownerMood.wins += cappedDeltas.wins;
		await idb.cache.teamSeasons.put(teamSeason);
	}

	return {
		cappedDeltas,
		deltas,
	};
};

export default updateOwnerMood;
