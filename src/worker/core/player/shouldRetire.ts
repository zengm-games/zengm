import {
	bySport,
	isSport,
	PHASE,
	PLAYER,
	REAL_PLAYERS_INFO,
} from "../../../common/index.ts";
import { g, random } from "../../util/index.ts";
import type { MinimalPlayerRatings, Player } from "../../../common/types.ts"; // Players meeting one of these cutoffs might retire
import { range } from "../../../common/utils.ts";
import loadDataBasketball from "../realRosters/loadData.basketball.ts";
import realRosters from "../realRosters/index.ts";
import { idb } from "../../db/index.ts";

const checkForceRetireSeasons = (p: Player<MinimalPlayerRatings>) => {
	// No redshirt seasons before league was created, since we have no stats then
	const firstPossibleRedshirtSeason = Math.max(
		g.get("startingSeason"),
		p.draft.year + 1,
	);

	// Initialize with all possible seasons played, in case a player was unsigned an entire year so there is no entry in p.stats
	const redshirtSeasons = new Set(
		range(firstPossibleRedshirtSeason, g.get("season") + 1),
	);

	// If a season has games played, it can't be a redshirt season
	for (const row of p.stats) {
		if (row.gp > 0) {
			redshirtSeasons.delete(row.season);
		}
	}

	const NUM_REDSHIRT_YEARS_ALLOWED = 1;
	const numRedshirtSeasons = Math.min(
		NUM_REDSHIRT_YEARS_ALLOWED,
		redshirtSeasons.size,
	);
	const numSeasonsInLeague = g.get("season") - p.draft.year;

	return numSeasonsInLeague - numRedshirtSeasons >= g.get("forceRetireSeasons");
};

// retire -> Real player has no ratings for the season where he is one year older than he is now, so retire him
// noRetire -> Real player does have ratings, so don't retire him
// passThrough -> This age would put the player past the latest season we have real player data for, so don't decide anything here, let the normal retirement algorithm apply
const checkForceRetireRealPlayers = async (
	p: Player<MinimalPlayerRatings>,
): Promise<"retire" | "noRetire" | "passThrough"> => {
	const srID = p.srID;
	if (srID === undefined) {
		return "passThrough";
	}

	const basketball = await loadDataBasketball();
	const bio = basketball.bios[srID];
	if (!bio) {
		return "passThrough";
	}

	const age = g.get("season") - p.born.year;

	const targetSeason = bio.bornYear + age + 1;

	if (REAL_PLAYERS_INFO && targetSeason > REAL_PLAYERS_INFO.MAX_SEASON) {
		// We are beyond the latest season of real players data, so just keep him active
		return "passThrough";
	}

	const playerActiveSeasons = await realRosters.getPlayerActiveSeasons();

	// Object.hasOwn check is because the value could be undefined if the team doesn't exist in this league (imported player or deleted team or whatever) but we still want to recognize the player as being active that season
	const active = playerActiveSeasons[srID]
		? Object.hasOwn(playerActiveSeasons[srID], targetSeason)
		: false;

	// Do we need to schedule unretirement?
	if (!active) {
		const retiredUntil = playerActiveSeasons[srID]?.retiredUntil;
		if (retiredUntil) {
			const unretireYear = retiredUntil[targetSeason];
			if (unretireYear !== undefined) {
				await idb.cache.scheduledEvents.add({
					type: "unretirePlayer",
					season: unretireYear - 1,
					phase: PHASE.DRAFT_LOTTERY,
					info: {
						pid: p.pid,
					},
				});
			}
		}
	}

	return active ? "noRetire" : "retire";
};

const shouldRetire = async (
	p: Player<MinimalPlayerRatings>,
): Promise<boolean> => {
	const season = g.get("season");
	const forceRetireAge = g.get("forceRetireAge");

	const age = season - p.born.year;

	if (forceRetireAge >= g.get("draftAges")[1] && age >= forceRetireAge) {
		return true;
	}

	if (g.get("forceRetireSeasons") > 0 && checkForceRetireSeasons(p)) {
		return true;
	}

	if (
		(g.get("forceRetireRealPlayers") || g.get("forceHistoricalRosters")) &&
		p.srID !== undefined
	) {
		const response = await checkForceRetireRealPlayers(p);
		if (response === "noRetire") {
			return false;
		} else if (response === "retire") {
			return true;
		}
	}

	if (age < g.get("minRetireAge")) {
		return false;
	}

	const { ovr, pos } = p.ratings.at(-1)!;

	// Originally this used pot, but pot is about 1.1*value, and value is consistent in leagues with different ratings distributions
	const pot = 1.1 * p.value;

	if (isSport("basketball")) {
		const maxAge = 33;
		const minPot = 40;

		// Only players older than maxAge or without a contract will retire
		if (age > maxAge || (pot < minPot && p.tid === PLAYER.FREE_AGENT)) {
			let ws = 0;
			for (const stats of p.stats) {
				if (stats.season === g.get("season") && !stats.playoffs) {
					ws += stats.dws + stats.ows;
				}
			}

			// Formulas from @nicidob
			const estWS = (1 / 85.017) * (Math.max(pot, 37) - 37) ** 2;
			const logit =
				-1.4134 +
				(1 / 175.19) * (Math.max(age, 18) - 18) ** 2 -
				0.971 * Math.max(ws, estWS);

			const odds = Math.exp(logit);
			const prob = odds / (1 + odds);

			if (prob > Math.random()) {
				return true;
			}

			// Second condition, for aging stars who are still pretty good, but clearly past their prime
			if (age > maxAge) {
				const maxOvr = Math.max(...p.ratings.map((row) => row.ovr));
				const ovrFraction = ovr / maxOvr;
				if (ovrFraction < 0.7) {
					const prob2 = 0.2 + (0.7 - ovrFraction);
					if (prob2 > Math.random()) {
						return true;
					}
				}
			}
		}
	} else {
		const maxAge = bySport({
			baseball: 36,
			basketball: 0,
			football: pos === "QB" || pos === "P" || pos === "K" ? 35 : 32,
			hockey: 36,
		});
		const minPot = 50;

		// Only players older than maxAge or without a contract will retire
		if (age > maxAge || (pot < minPot && p.tid === PLAYER.FREE_AGENT)) {
			let excessAge = 0;

			if (age > maxAge) {
				excessAge = (age - maxAge) / 40; // 0.025 for each year beyond maxAge
			}

			const excessPot = (minPot - pot) / 50; // 0.02 for each potential rating below minPot (this can be negative)

			if (excessAge + excessPot + random.gauss(0, 1) > 0) {
				return true;
			}
		}
	}

	// Retire players who have been free agents for more than one years
	if (p.tid === PLAYER.FREE_AGENT && p.yearsFreeAgent >= 1) {
		return true;
	}

	return false;
};

export default shouldRetire;
