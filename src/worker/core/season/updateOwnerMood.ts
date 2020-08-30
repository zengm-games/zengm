import { idb } from "../../db";
import { g } from "../../util";
import type { OwnerMood } from "../../../common/types";

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
	const t = await idb.getCopy.teamsPlus({
		seasonAttrs: ["won", "playoffRoundsWon", "profit"],
		season: g.get("season"),
		tid: g.get("userTid"),
	});

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

	const salaryCapFactor = g.get("salaryCap") / 90000;

	const expectedProfit = 15 * salaryCapFactor;

	const numPlayoffRounds = g.get("numGamesPlayoffSeries", "current").length;
	const deltas = {
		wins:
			(0.25 * (t.seasonAttrs.won - g.get("numGames") / 2)) /
			(g.get("numGames") / 2),
		playoffs: 0,
		money: g.get("budget")
			? (t.seasonAttrs.profit - expectedProfit) /
			  (100 * Math.sqrt(salaryCapFactor))
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
