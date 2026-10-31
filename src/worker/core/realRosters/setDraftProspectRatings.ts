import {
	REAL_DRAFT_RATINGS,
	REAL_PLAYERS_INFO,
} from "../../../common/constants.ts";
import { RATINGS } from "../../../common/constants.basketball.ts";
import type { RatingKey } from "../../../common/types.basketball.ts";
import type {
	RealDraftRatings,
	RealDraftRatingsSetting,
} from "../../../common/types.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import player from "../player/index.ts";
import genRatings from "../player/genRatings.basketball.ts";
import ovr from "../player/ovr.basketball.ts";
import { potEstimatorBasketballWithoutNoise } from "../player/potEstimator.ts";
import type { Basketball } from "./loadData.basketball.ts";

/*
Run this script in the worker console in a random players league (30 teams) to get the data:

N = 1000;
sums = undefined;
for (let i = 0; i < N; i++) {
    console.log(i);
    const players = await bbgm.draft.genPlayersWithoutSaving(0, 34, []);
    const values = players.map(p => bbgm.player.valueCombineOvrPot(p.ratings[0].ovr, p.ratings[0].pot, -p.born.year)).sort((a, b) => b - a);
    if (sums === undefined) {
        sums = Array(values.length).fill(0);
    }
    for (let j = 0; j < sums.length; j++) {
        sums[j] += values[j] / N;
    }
}
console.log(`const VALUE_BY_PICK = ${JSON.stringify(sums.map(sum => helpers.localeParseFloat(sum.toFixed(1))).slice(0, 60))};\nconst VALUE_UNDRAFTED = ${sums[63].toFixed(1)};`);
*/
const VALUE_BY_PICK = [
	64.3, 61.7, 60.1, 58.9, 58.1, 57.3, 56.7, 56.1, 55.5, 55.1, 54.7, 54.3, 53.9,
	53.5, 53.2, 52.9, 52.6, 52.3, 52, 51.7, 51.5, 51.2, 51, 50.7, 50.5, 50.3, 50,
	49.8, 49.6, 49.3, 49.1, 48.9, 48.6, 48.4, 48.2, 48, 47.8, 47.5, 47.3, 47.1,
	46.8, 46.6, 46.3, 46.1, 45.8, 45.5, 45.2, 44.9, 44.6, 44.2, 43.9, 43.5, 43.1,
	42.6, 42.2, 41.7, 41.2, 40.7, 40.2, 39.6,
];
const VALUE_UNDRAFTED = 36.6;

/*
Like VALUE_BY_PICK, but pooling many draft classes together, so the top end includes players better than the best player in a typical draft class. Each row is [fraction of draft prospects who are better, value]. Run this script in the worker console in a random players league (30 teams) to get the data:

N = 5000;
values = [];
for (let i = 0; i < N; i++) {
    const players = await bbgm.draft.genPlayersWithoutSaving(0, 34, []);
    values.push(...players.map(p => bbgm.player.valueCombineOvrPot(p.ratings[0].ovr, p.ratings[0].pot, -p.born.year)));
}
values.sort((a, b) => b - a);
quantiles = [0.0001, 0.0002, 0.0003, 0.0005, 0.0007, 0.001, 0.0015, 0.002, 0.003, 0.005, 0.007, 0.01, 0.02, 0.03, 0.05, 0.07, 0.1, 0.15, 0.2, 0.25, 0.3, 0.35, 0.4, 0.45, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85, 0.9, 0.93, 0.95, 0.97, 0.98, 0.99];
console.log(`const VALUE_BY_QUANTILE = ${JSON.stringify(quantiles.map(q => [q, helpers.localeParseFloat(values[Math.round(q * values.length) - 1].toFixed(1))]))};`);
*/
const VALUE_BY_QUANTILE: [number, number][] = [
	[0.0001, 73],
	[0.0002, 72.2],
	[0.0003, 71.4],
	[0.0005, 70.6],
	[0.0007, 70],
	[0.001, 69.4],
	[0.0015, 68.5],
	[0.002, 67.9],
	[0.003, 67.1],
	[0.005, 65.8],
	[0.007, 65.1],
	[0.01, 64.1],
	[0.02, 62.2],
	[0.03, 60.8],
	[0.05, 59],
	[0.07, 57.8],
	[0.1, 56.4],
	[0.15, 54.7],
	[0.2, 53.5],
	[0.25, 52.4],
	[0.3, 51.5],
	[0.35, 50.6],
	[0.4, 49.7],
	[0.45, 49],
	[0.5, 48.2],
	[0.55, 47.3],
	[0.6, 46.6],
	[0.65, 45.6],
	[0.7, 44.6],
	[0.75, 43.2],
	[0.8, 41.6],
	[0.85, 39.6],
	[0.9, 37.1],
	[0.93, 35.1],
	[0.95, 33.4],
	[0.97, 31],
	[0.98, 29.4],
	[0.99, 27.2],
];

// For the "career" setting, only seasons with ovr above this count towards a player's career value, so that hanging around the end of the bench for a long time doesn't count for much
const REPLACEMENT_OVR = 40;

// For projecting the rest of the careers of active players, look at historical players with similar ovr at the same age. Only use seasons long enough ago that those players' careers are basically complete.
const MIN_YEARS_AGO_COMPARABLE = 15;
const MIN_NUM_COMPARABLES = 20;
const MAX_OVR_DIFF_COMPARABLE = 10;

const getValue = (ratings: Record<RatingKey, number>, age: number) => {
	const ovrValue = ovr(ratings);
	const pot = potEstimatorBasketballWithoutNoise(ovrValue, age);

	return player.valueCombineOvrPot(ovrValue, pot, age);
};

// index is the 0-based position in a 30 team draft, and can be fractional
const getTargetValueFromIndex = (index: number) => {
	if (index >= VALUE_BY_PICK.length) {
		return VALUE_UNDRAFTED;
	}

	const remainder = index % 1;
	const lower = Math.floor(index);
	return (
		(1 - remainder) * VALUE_BY_PICK[lower]! +
		remainder * (VALUE_BY_PICK[lower + 1] ?? VALUE_UNDRAFTED)
	);
};

// quantile is the fraction of draft prospects who are better than this player
const getTargetValueFromQuantile = (quantile: number) => {
	const upperIndex = VALUE_BY_QUANTILE.findIndex((row) => row[0] >= quantile);
	if (upperIndex === 0) {
		return VALUE_BY_QUANTILE[0]![1];
	}
	if (upperIndex === -1) {
		return VALUE_BY_QUANTILE.at(-1)![1];
	}

	const [lowerQuantile, lowerValue] = VALUE_BY_QUANTILE[upperIndex - 1]!;
	const [upperQuantile, upperValue] = VALUE_BY_QUANTILE[upperIndex]!;
	const fraction = (quantile - lowerQuantile) / (upperQuantile - lowerQuantile);
	return (1 - fraction) * lowerValue + fraction * upperValue;
};

// Shift all ratings except hgt up or down until the player's value is as close as possible to targetValue
const adjustRatingsToTargetValue = (
	ratings: Record<RatingKey, number>,
	age: number,
	targetValue: number,
) => {
	let diff = targetValue - getValue(ratings, age);
	const direction = Math.sign(diff);

	while (true) {
		const prevRatings = { ...ratings };
		const prevDiff = diff;

		let changed = false;
		for (const rating of RATINGS) {
			if (rating !== "hgt") {
				const newRating = player.limitRating(ratings[rating] + direction);
				if (newRating !== ratings[rating]) {
					ratings[rating] = newRating;
					changed = true;
				}
			}
		}

		if (!changed) {
			// Every rating is already at its limit
			return;
		}

		diff = targetValue - getValue(ratings, age);

		if ((diff <= 0 && direction > 0) || (diff >= 0 && direction < 0)) {
			// Went past targetValue, so keep whichever of the last two steps was closer
			if (Math.abs(prevDiff) < Math.abs(diff)) {
				Object.assign(ratings, prevRatings);
			}
			return;
		}
	}
};

const getIndexFromDraftPosition = (draft: {
	round: number | undefined;
	pick: number | undefined;
}) => {
	// In theory this should change with draft class, but doesn't seem to matter too much
	const numTeams = 30;

	if (draft.round === undefined || draft.pick === undefined) {
		// Draft must not have happened yet
		return;
	}

	if (draft.round < 1 || draft.pick < 1) {
		return Infinity;
	}

	return (draft.round - 1) * numTeams + (draft.pick - 1);
};

type Season = {
	season: number;
	age: number;
	ovr: number;
};

type CareerScores = {
	peak: number;
	career: number;
};

const getCareerValue = (seasons: Season[]) =>
	Math.sumPrecise(seasons.map((row) => Math.max(0, row.ovr - REPLACEMENT_OVR)));

// Ratings from every season each player was in the league, excluding draft prospect ratings and seasons spent retired
const getSeasonsBySlug = (basketball: Basketball) => {
	const seasonsBySlug: Record<string, Season[]> = {};
	for (const row of basketball.ratings) {
		const bio = basketball.bios[row.slug];
		if (
			!bio ||
			row.season === bio.draftYear ||
			row.retiredUntil !== undefined
		) {
			continue;
		}

		const seasons = (seasonsBySlug[row.slug] ??= []);
		seasons.push({
			season: row.season,
			age: row.season - bio.bornYear,
			ovr: ovr(row),
		});
	}

	return seasonsBySlug;
};

const getCareerScoresBySlug = (basketball: Basketball) => {
	const maxSeason = REAL_PLAYERS_INFO!.MAX_SEASON;
	const seasonsBySlug = getSeasonsBySlug(basketball);

	// What happened in the rest of the career of each historical player after each season, indexed by age and ovr
	const comparables: Record<number, Record<number, CareerScores[]>> = {};
	for (const seasons of Object.values(seasonsBySlug)) {
		for (const [i, row] of seasons.entries()) {
			if (row.season > maxSeason - MIN_YEARS_AGO_COMPARABLE) {
				break;
			}

			const futureSeasons = seasons.slice(i + 1);
			const comparablesAge = (comparables[row.age] ??= {});
			const comparablesAgeOvr = (comparablesAge[row.ovr] ??= []);
			comparablesAgeOvr.push({
				peak: Math.max(0, ...futureSeasons.map((row) => row.ovr)),
				career: getCareerValue(futureSeasons),
			});
		}
	}

	const getComparables = (row: Season) => {
		const comparablesAge = comparables[row.age];
		if (!comparablesAge) {
			return [];
		}

		// Widen the range of ovr until there are enough comparable players
		const output = [...(comparablesAge[row.ovr] ?? [])];
		for (let ovrDiff = 1; ovrDiff <= MAX_OVR_DIFF_COMPARABLE; ovrDiff++) {
			if (output.length >= MIN_NUM_COMPARABLES) {
				break;
			}
			output.push(
				...(comparablesAge[row.ovr - ovrDiff] ?? []),
				...(comparablesAge[row.ovr + ovrDiff] ?? []),
			);
		}

		return output;
	};

	const careerScoresBySlug = new Map<string, CareerScores>();
	for (const [slug, seasons] of Object.entries(seasonsBySlug)) {
		let peak = Math.max(...seasons.map((row) => row.ovr));
		let career = getCareerValue(seasons);

		// Project the rest of the career for active players, based on what happened to historical players in similar situations
		const lastSeason = seasons.at(-1)!;
		if (lastSeason.season === maxSeason) {
			const futures = getComparables(lastSeason);
			if (futures.length > 0) {
				const observedPeak = peak;
				peak =
					Math.sumPrecise(
						futures.map((future) => Math.max(observedPeak, future.peak)),
					) / futures.length;
				career +=
					Math.sumPrecise(futures.map((future) => future.career)) /
					futures.length;
			}
		}

		careerScoresBySlug.set(slug, { peak, career });
	}

	return careerScoresBySlug;
};

// Rank every real player by their career score, and convert that to a quantile for getTargetValueFromQuantile, as if all real players were a sample from the same distribution as random draft prospects
const getQuantilesBySlug = (
	careerScoresBySlug: Map<string, CareerScores>,
	key: keyof CareerScores,
) => {
	const scores = [...careerScoresBySlug.values()]
		.map((careerScores) => careerScores[key])
		.sort((a, b) => b - a);

	// Players with the same score get the average of their ranks
	const ranksByScore = new Map<number, number>();
	let firstIndex = 0;
	for (const [i, score] of scores.entries()) {
		if (scores[i + 1] !== score) {
			ranksByScore.set(score, (firstIndex + i) / 2);
			firstIndex = i + 1;
		}
	}

	const quantilesBySlug = new Map<string, number>();
	for (const [slug, careerScores] of careerScoresBySlug) {
		const rank = ranksByScore.get(careerScores[key])!;

		// Middle of the range of quantiles this rank covers, so the best player is not treated as better than every possible draft prospect
		quantilesBySlug.set(slug, (rank + 0.5) / scores.length);
	}

	return quantilesBySlug;
};

const quantilesCache = new WeakMap<
	Basketball,
	Record<"peak" | "career", Map<string, number>>
>();
const getQuantileFromCareer = (
	basketball: Basketball,
	key: "peak" | "career",
	slug: string,
) => {
	let quantiles = quantilesCache.get(basketball);
	if (!quantiles) {
		const careerScoresBySlug = getCareerScoresBySlug(basketball);
		quantiles = {
			peak: getQuantilesBySlug(careerScoresBySlug, "peak"),
			career: getQuantilesBySlug(careerScoresBySlug, "career"),
		};
		quantilesCache.set(basketball, quantiles);
	}

	// undefined for players who have not played in the league yet, like future draft prospects
	return quantiles[key].get(slug);
};

// Normalized so the weights sum to 1
const getWeights = (realDraftRatings: RealDraftRatingsSetting) => {
	const weights: Record<RealDraftRatings, number> = {
		rookie: 0,
		draft: 0,
		peak: 0,
		career: 0,
		random: 0,
	};

	if (typeof realDraftRatings === "string") {
		weights[realDraftRatings] = 1;
		return weights;
	}

	const sum = Math.sumPrecise(Object.values(realDraftRatings));
	if (sum <= 0) {
		weights.rookie = 1;
		return weights;
	}

	for (const mode of REAL_DRAFT_RATINGS) {
		weights[mode] = realDraftRatings[mode] / sum;
	}
	return weights;
};

// ratings should already have nerfDraftProspect applied
export const setDraftProspectRatings = ({
	age,
	basketball,
	draft,
	ratings,
	realDraftRatings,
	slug,
}: {
	age: number;
	basketball: Basketball;
	draft: {
		round: number | undefined;
		pick: number | undefined;
	};
	ratings: Record<RatingKey, number>;
	realDraftRatings: RealDraftRatingsSetting;
	slug: string;
}) => {
	const weights = getWeights(realDraftRatings);
	const rookieValue = getValue(ratings, age);

	const getTargetValue = (mode: RealDraftRatings) => {
		if (mode === "random") {
			return getTargetValueFromQuantile(Math.random());
		}

		if (mode === "draft") {
			const index = getIndexFromDraftPosition(draft);
			if (index !== undefined) {
				return getTargetValueFromIndex(index);
			}
		} else if (mode === "peak" || mode === "career") {
			const quantile = getQuantileFromCareer(basketball, mode, slug);
			if (quantile !== undefined) {
				return getTargetValueFromQuantile(quantile);
			}
		}

		// For "rookie", and also when another mode has no data for this player, like the draft position of a future draft prospect
		return rookieValue;
	};

	let targetValue = 0;
	for (const mode of REAL_DRAFT_RATINGS) {
		if (weights[mode] > 0) {
			targetValue += weights[mode] * getTargetValue(mode);
		}
	}

	if (weights.random > 0) {
		// genRatings is just for the shape of the ratings. Its values are lower than real random draft prospects, which also get developed in genPlayersWithoutSaving, which is why the "random" target value comes from VALUE_BY_QUANTILE.
		const randomRatings = genRatings(0, DEFAULT_LEVEL, ratings.hgt).ratings;
		for (const rating of RATINGS) {
			if (rating !== "hgt") {
				ratings[rating] = Math.round(
					(1 - weights.random) * ratings[rating] +
						weights.random * randomRatings[rating],
				);
			}
		}
	}

	adjustRatingsToTargetValue(ratings, age, targetValue);
};
