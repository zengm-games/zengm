import { g } from "../../util/index.ts";
import { getFirstRoundSlotProbs } from "../draft/getFirstRoundSlotProbs.ts";
import { getSlotPickProbs } from "../draft/getSlotPickProbs.ts";
import { getDraftLotteryProbs } from "../draft/draftLottery.ts";
import type { DraftLotteryResult } from "../../../common/types.ts";

// These are slow to compute, and many ValueChangeCalculator instances are short lived, so cache results here rather than in ValueChangeCalculator. Keys include everything that affects the result, so there is no need to invalidate these caches.

const NUM_SIMS = 1000;

// For when speed matters more than precision, like the many trades between AI teams that are evaluated while simulating games
const NUM_SIMS_QUICK = 100;

// Remembers the most recent results, including pending ones so concurrent calls don't duplicate work
const makeCache = <T>(maxSize: number) => {
	const cache = new Map<string, Promise<T>>();

	return (key: string, cb: () => Promise<T>) => {
		let promise = cache.get(key);
		if (!promise) {
			promise = cb();
			cache.set(key, promise);

			// Don't remember errors
			promise.catch(() => {
				cache.delete(key);
			});

			if (cache.size > maxSize) {
				// Delete the oldest entry
				for (const oldestKey of cache.keys()) {
					cache.delete(oldestKey);
					break;
				}
			}
		}

		return promise;
	};
};

// Settings that affect who makes the playoffs and the draft order
const getSettingsKey = () => {
	return [
		g.get("lid"),
		g.get("season"),
		g.get("phase"),
		g.get("draftType"),
		g.get("numGames"),
		g.get("numGamesPlayoffSeries", "current"),
		g.get("numPlayoffByes", "current"),
		g.get("playIn"),
		g.get("playoffsByConf"),
		g.get("playoffsNumTeamsDiv", "current"),
		g.get("pointsFormula", "current"),
		g.get("confs", "current").length,
		g.get("draftLotteryCustomChances"),
		g.get("draftLotteryCustomNumPicks"),
	];
};

export type ProjectedTeam = Parameters<
	typeof getFirstRoundSlotProbs
>[0]["teams"][number];

const firstRoundSlotProbsCache =
	makeCache<Awaited<ReturnType<typeof getFirstRoundSlotProbs>>>(20);

export const getFirstRoundSlotProbsCached = (
	teams: ProjectedTeam[],
	quick: boolean,
) => {
	const numSims = quick ? NUM_SIMS_QUICK : NUM_SIMS;
	const key = JSON.stringify([getSettingsKey(), numSims, teams]);

	return firstRoundSlotProbsCache(key, () => {
		return getFirstRoundSlotProbs({
			teams,
			draftType: g.get("draftType"),
			numSims,
		});
	});
};

const slotPickProbsCache =
	makeCache<Awaited<ReturnType<typeof getSlotPickProbs>>>(20);

export const getSlotPickProbsCached = (round: number, numTeams: number) => {
	const key = JSON.stringify([getSettingsKey(), round, numTeams]);

	return slotPickProbsCache(key, () => {
		return getSlotPickProbs({
			draftType: g.get("draftType"),
			round,
			numTeams,
		});
	});
};

const draftLotteryProbsCache =
	makeCache<ReturnType<typeof getDraftLotteryProbs>["probs"]>(20);

// For a real draft lottery, not a hypothetical one like getSlotPickProbsCached
export const getDraftLotteryProbsCached = (
	draftLotteryResult: DraftLotteryResult<boolean>,
	numToPick: number,
) => {
	const key = JSON.stringify([
		draftLotteryResult.draftType,
		draftLotteryResult.result.map((row) => row.chances),
		draftLotteryResult.nba2027,
		numToPick,
	]);

	return draftLotteryProbsCache(key, () => {
		return Promise.resolve(
			getDraftLotteryProbs(
				draftLotteryResult,
				draftLotteryResult.draftType,
				numToPick,
			).probs,
		);
	});
};
