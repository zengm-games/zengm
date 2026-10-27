import { REAL_PLAYERS_INFO } from "../../../common/constants.ts";
import { RATINGS } from "../../../common/constants.basketball.ts";
import type { RatingKey } from "../../../common/types.basketball.ts";
import type { RealDraftRatings } from "../../../common/types.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import player from "../player/index.ts";
import genRatings from "../player/genRatings.basketball.ts";
import ovr from "../player/ovr.basketball.ts";
import potEstimator from "../player/potEstimator.ts";
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

// Size of the draft classes VALUE_BY_PICK was generated from - 30 teams, 2 rounds, and the 7/6 factor in genPlayersWithoutSaving
const NUM_PLAYERS_PER_DRAFT_CLASS = 70;

// For the "career" setting, only seasons with ovr above this count towards a player's career value, so that hanging around the end of the bench for a long time doesn't count for much
const REPLACEMENT_OVR = 40;

// For projecting the rest of the careers of active players, look at historical players with similar ovr at the same age. Only use seasons long enough ago that those players' careers are basically complete.
const MIN_YEARS_AGO_COMPARABLE = 15;
const MIN_NUM_COMPARABLES = 20;
const MAX_OVR_DIFF_COMPARABLE = 10;

const getValue = (ratings: Record<RatingKey, number>, age: number) => {
	const ovrValue = ovr(ratings);
	const pot = potEstimator(ovrValue, age);

	return player.valueCombineOvrPot(ovrValue, pot, age);
};

// index is the 0-based position in a 30 team draft, and can be fractional
const getTargetValue = (index: number) => {
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

// Shift all ratings except hgt up or down until the player's value matches targetValue
const adjustRatingsToTargetValue = (
	ratings: Record<RatingKey, number>,
	age: number,
	targetValue: number,
) => {
	let value = getValue(ratings, age);
	let diff = targetValue - value;
	if (Math.abs(diff) < 1) {
		return;
	}

	const direction = Math.sign(diff);

	while (true) {
		for (const rating of RATINGS) {
			if (rating !== "hgt") {
				ratings[rating] = player.limitRating(ratings[rating] + direction);
			}
		}

		value = getValue(ratings, age);
		diff = targetValue - value;

		if ((diff <= 0 && direction > 0) || (diff >= 0 && direction < 0)) {
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

// Rank every real player by their career score, and convert that to an index like getIndexFromDraftPosition, as if every real player was in a draft class with NUM_PLAYERS_PER_DRAFT_CLASS players
const getIndexesBySlug = (
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

	const indexesBySlug = new Map<string, number>();
	for (const [slug, careerScores] of careerScoresBySlug) {
		const rank = ranksByScore.get(careerScores[key])!;
		indexesBySlug.set(
			slug,
			(rank / scores.length) * NUM_PLAYERS_PER_DRAFT_CLASS,
		);
	}

	return indexesBySlug;
};

const indexesCache = new WeakMap<
	Basketball,
	Record<"peak" | "career", Map<string, number>>
>();
const getIndexFromCareer = (
	basketball: Basketball,
	key: "peak" | "career",
	slug: string,
) => {
	let indexes = indexesCache.get(basketball);
	if (!indexes) {
		const careerScoresBySlug = getCareerScoresBySlug(basketball);
		indexes = {
			peak: getIndexesBySlug(careerScoresBySlug, "peak"),
			career: getIndexesBySlug(careerScoresBySlug, "career"),
		};
		indexesCache.set(basketball, indexes);
	}

	// undefined for players who have not played in the league yet, like future draft prospects
	return indexes[key].get(slug);
};

const setRandomRatings = (ratings: Record<RatingKey, number>, age: number) => {
	const randomRatings = genRatings(0, DEFAULT_LEVEL, ratings.hgt).ratings;
	for (const rating of RATINGS) {
		ratings[rating] = randomRatings[rating];
	}

	// genRatings is just for the shape of the ratings. Its values are lower than real random draft prospects, which also get developed in genPlayersWithoutSaving. So pick a value like a random player from a random draft class.
	const index = Math.random() * NUM_PLAYERS_PER_DRAFT_CLASS;
	adjustRatingsToTargetValue(ratings, age, getTargetValue(index));
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
	realDraftRatings: RealDraftRatings;
	slug: string;
}) => {
	if (realDraftRatings === "rookie") {
		return;
	}

	if (realDraftRatings === "random") {
		setRandomRatings(ratings, age);
		return;
	}

	const index =
		realDraftRatings === "draft"
			? getIndexFromDraftPosition(draft)
			: getIndexFromCareer(basketball, realDraftRatings, slug);
	if (index === undefined) {
		return;
	}

	adjustRatingsToTargetValue(ratings, age, getTargetValue(index));
};
