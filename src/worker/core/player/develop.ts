import {
	bySport,
	isSport,
	NOT_REAL_POSITIONS,
	PLAYER,
	POSITIONS,
} from "../../../common/index.ts";
import developSeason from "./developSeason.ts";
import ovr from "./ovr.ts";
import pos from "./pos.ts";
import skills from "./skills.ts";
import { g, helpers, random } from "../../util/index.ts";
import type { MinimalPlayerRatings, PlayerInjury } from "../../../common/types.ts";
import genWeight from "./genWeight.ts";
import potEstimator from "./potEstimator.ts";
import { TOO_MANY_TEAMS_TOO_SLOW } from "../season/getInitialNumGamesConfDivSettings.ts";
import { DEFAULT_LEVEL } from "../../../common/budgetLevels.ts";
import limitRating from "./limitRating.ts";

/**
 * Apply injury impact on development.
 * Major injuries can stunt development or cause permanent rating loss.
 * @param ratings Player ratings to modify
 * @param injuries Recent injury history
 * @param age Player's current age
 */
const applyInjuryImpact = (
	ratings: MinimalPlayerRatings,
	injuries: PlayerInjury[] | undefined,
	age: number,
): void => {
	if (!injuries || injuries.length === 0) {
		return;
	}

	// Look at injuries from the most recent season
	const currentSeason = g.get("season");
	const recentInjuries = injuries.filter(
		(inj) => inj.season === currentSeason || inj.season === currentSeason - 1,
	);

	if (recentInjuries.length === 0) {
		return;
	}

	// Calculate total games missed recently
	let totalGamesMissed = 0;
	let hasSeriousInjury = false;

	for (const injury of recentInjuries) {
		totalGamesMissed += injury.gamesRemaining || 0;

		// Check for serious injuries that cause lasting damage
		const seriousInjuries = [
			"ACL", "Achilles", "Torn", "Fractured", "Broken",
			"Ruptured", "Torn Meniscus", "Labrum",
		];
		if (seriousInjuries.some((s) => injury.type.includes(s))) {
			hasSeriousInjury = true;
		}
	}

	// Minor injuries (< 10 games): No lasting impact
	if (totalGamesMissed < 10 && !hasSeriousInjury) {
		return;
	}

	// Moderate injuries (10-30 games): Slight development penalty
	if (totalGamesMissed >= 10 && totalGamesMissed < 30 && !hasSeriousInjury) {
		// Young players recover better
		const recoveryPenalty = age <= 25 ? 0.5 : 1;
		const penaltyAmount = Math.floor(recoveryPenalty);

		// Apply small penalty to physical attributes
		if (typeof (ratings as any).spd === "number") {
			(ratings as any).spd = limitRating((ratings as any).spd - penaltyAmount);
		}
		if (typeof (ratings as any).jmp === "number") {
			(ratings as any).jmp = limitRating((ratings as any).jmp - penaltyAmount);
		}
		return;
	}

	// Serious injuries (30+ games or major injury type): Significant impact
	const basePenalty = hasSeriousInjury ? 3 : 2;
	const ageFactor = age <= 25 ? 0.6 : age <= 30 ? 0.8 : 1.0;
	const penaltyAmount = Math.floor(basePenalty * ageFactor);

	// Physical attributes take the biggest hit
	const physicalRatings = ["spd", "jmp", "endu"];
	for (const key of physicalRatings) {
		if (typeof (ratings as any)[key] === "number") {
			(ratings as any)[key] = limitRating(
				(ratings as any)[key] - penaltyAmount - random.randInt(0, 2),
			);
		}
	}

	// For very serious injuries, some skill ratings may also decline slightly
	if (hasSeriousInjury && totalGamesMissed >= 40) {
		const skillPenalty = Math.floor(penaltyAmount / 2);
		const allRatingKeys = Object.keys(ratings).filter(
			(k) =>
				typeof (ratings as any)[k] === "number" &&
				!["hgt", "fuzz", "ovr", "pot", "season"].includes(k),
		);

		// Apply small penalty to 2-3 random skill ratings
		const numSkillsAffected = random.randInt(2, 3);
		const affectedSkills = random.sample(allRatingKeys, numSkillsAffected);

		for (const key of affectedSkills) {
			(ratings as any)[key] = limitRating(
				(ratings as any)[key] - skillPenalty,
			);
		}
	}
};

const NUM_SIMULATIONS = 20; // Higher is more accurate, but slower. Low accuracy is fine, though!

// Repeatedly simulate aging up to 29, and pick the 75th percentile max
export const monteCarloPot = async ({
	ratings,
	age,
	srID,
	pos,
	usePotEstimator,
}: {
	ratings: MinimalPlayerRatings;
	age: number;
	srID?: string;
	pos?: string;
	usePotEstimator?: boolean;
}): Promise<number> => {
	if (age >= 29) {
		return pos ? ratings.ovrs[pos] : ratings.ovr;
	}

	if (
		bySport({
			baseball: true,
			basketball:
				usePotEstimator || g.get("numActiveTeams") >= TOO_MANY_TEAMS_TOO_SLOW,
			football: true,
			hockey: true,
		})
	) {
		let ovr;
		let pot;

		if (!isSport("basketball")) {
			if (pos === undefined) {
				throw new Error("pos is required for potEstimator");
			}

			ovr = ratings.ovrs[pos];
			pot = potEstimator(ovr, age, pos);
		} else {
			ovr = ratings.ovr;
			pot = potEstimator(ovr, age);
		}

		pot += random.randInt(-2, 2);

		if (ovr > pot) {
			return ovr;
		}

		return helpers.bound(Math.round(pot), 0, 100);
	}

	const maxOvrs = [];

	for (let i = 0; i < NUM_SIMULATIONS; i++) {
		const copiedRatings = helpers.deepCopy(ratings);
		let maxOvr = pos ? ratings.ovrs[pos] : ratings.ovr;

		for (let ageTemp = age + 1; ageTemp < 30; ageTemp++) {
			await developSeason(copiedRatings, ageTemp, srID, DEFAULT_LEVEL, true);

			const currentOvr = ovr(copiedRatings, pos);

			if (currentOvr > maxOvr) {
				maxOvr = currentOvr;
			}
		}

		maxOvrs.push(maxOvr);
	}

	return maxOvrs.sort((a, b) => a - b)[Math.floor(0.75 * NUM_SIMULATIONS)];
};

/**
 * Develop (increase/decrease) player's ratings. This operates on whatever the last row of p.ratings is.
 *
 * Make sure to call updateValues after this! Otherwise, player values will be out of sync.
 *
 * @memberOf core.player
 * @param {Object} p Player object.
 * @param {number=} years Number of years to develop (default 1).
 * @param {boolean=} newPlayer Generating a new player? (default false). If true, then the player's age is also updated based on years.
 * @param {number=} coachingLevel
 * @return {Object} Updated player object.
 */
const develop = async (
	p: {
		born: {
			loc: string;
			year: number;
		};
		draft: {
			ovr: number;
			pot: number;
			skills: string[];
		};
		injuries?: PlayerInjury[];
		pos?: string;
		ratings: MinimalPlayerRatings[];
		tid: number;
		weight: number;
		srID?: string;
	},
	years: number = 1,
	newPlayer: boolean = false,
	coachingLevel: number = DEFAULT_LEVEL,
	skipPot: boolean = false, // Only for making testing or core/debug faster
) => {
	const ratings = p.ratings.at(-1)!;
	let age = ratings.season - p.born.year;

	for (let i = 0; i < years; i++) {
		// (CONFUSING!) Don't increment age for existing players developing one season (i.e. newPhasePreseason) because the season is already incremented before this function is called. But in other scenarios (new league and draft picks), the season is not changing, so age should be incremented every iteration of this loop.
		if (newPlayer || years > 1) {
			age += 1;
		}

		if (!ratings.locked) {
			await developSeason(ratings, age, p.srID, coachingLevel, false);
		}
	}

	// Apply injury impact on development (only for existing players, not new ones)
	if (!newPlayer && years > 0 && !ratings.locked) {
		applyInjuryImpact(ratings, p.injuries, age);
	}

	// years===0 condition is so editing locked player in God Mode will update ovr and pot
	if (!ratings.locked || years === 0) {
		// Run these even for players developing 0 seasons
		if (isSport("basketball")) {
			ratings.ovr = ovr(ratings);

			if (!skipPot) {
				ratings.pot = await monteCarloPot({ ratings, age, srID: p.srID });
			}

			if (typeof p.pos === "string") {
				// Must be a custom league player, let's not rock the boat
				ratings.pos = p.pos;
			} else {
				ratings.pos = pos(ratings);
			}
		} else {
			let pos;
			let maxOvr = -Infinity; // A player can never have KR or PR as his main position

			ratings.ovrs = POSITIONS.reduce((ovrs, pos2) => {
				ovrs[pos2] = ovr(ratings, pos2);

				if (!NOT_REAL_POSITIONS.includes(pos2) && ovrs[pos2] > maxOvr) {
					pos = pos2;
					maxOvr = ovrs[pos2];
				}

				return ovrs;
			}, {});

			if (!skipPot) {
				ratings.pots = {};
				for (const pos2 of POSITIONS) {
					ratings.pots[pos2] = await monteCarloPot({
						ratings,
						age,
						srID: p.srID,
						pos: pos2,
					});
				}
			}

			if (pos === undefined) {
				throw new Error("Should never happen");
			}

			if (typeof p.pos === "string") {
				pos = p.pos;
			}

			ratings.ovr = ratings.ovrs[pos];
			ratings.pot = ratings.pots[pos];
			ratings.pos = pos;
		}
	}

	if (!ratings.locked && years > 0) {
		// In the NBA displayed weights seem to never change and seem inaccurate
		if (isSport("football")) {
			const newWeight = genWeight(
				ratings.hgt,
				(ratings as any).stre,
				ratings.pos,
			);
			if (p.ratings.length <= 1) {
				p.weight = newWeight;
			} else {
				// Not a new player? Don't adjust too much.
				const oldWeight = p.weight;
				if (newWeight - oldWeight > 10) {
					p.weight = oldWeight + 10;
				} else if (newWeight - oldWeight < -10) {
					p.weight = oldWeight - 10;
				} else {
					p.weight = newWeight;
				}
			}
		}
	}

	ratings.skills = skills(ratings);

	if (p.tid === PLAYER.UNDRAFTED) {
		p.draft.ovr = ratings.ovr;

		if (!skipPot) {
			p.draft.pot = ratings.pot;
		}

		p.draft.skills = ratings.skills;
	}

	if (newPlayer) {
		p.born.year -= years;
	}
};

export default develop;
