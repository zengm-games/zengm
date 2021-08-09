import orderBy from "lodash-es/orderBy";
import { isSport, PLAYER, POSITIONS } from "../../../common";
import developSeason from "./developSeason";
import ovr from "./ovr";
import pos from "./pos";
import skills from "./skills";
import { g, helpers, random } from "../../util";
import type { MinimalPlayerRatings } from "../../../common/types";
import genWeight from "./genWeight";
import potEstimator from "./potEstimator";

const NUM_SIMULATIONS = 20; // Higher is more accurate, but slower. Low accuracy is fine, though!

// Repeatedly simulate aging up to 29, and pick the 75th percentile max
export const bootstrapPot = async ({
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
		isSport("football") ||
		isSport("hockey") ||
		(isSport("basketball") && usePotEstimator)
	) {
		let ovr;
		let pot;

		if (isSport("football") || isSport("hockey")) {
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
			await developSeason(copiedRatings, ageTemp, srID); // Purposely no coachingRank

			const currentOvr = ovr(copiedRatings, pos);

			if (currentOvr > maxOvr) {
				maxOvr = currentOvr;
			}
		}

		maxOvrs.push(maxOvr);
	}

	return orderBy(maxOvrs)[Math.floor(0.75 * NUM_SIMULATIONS)];
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
 * @param {number=} coachingRank From 1 to g.get("numActiveTeams") (default 30), where 1 is best coaching staff and g.get("numActiveTeams") is worst. Default is 15.5
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
		pos?: string;
		ratings: MinimalPlayerRatings[];
		tid: number;
		weight: number;
		srID?: string;
	},
	years: number = 1,
	newPlayer: boolean = false,
	coachingRank: number = (g.get("numActiveTeams") + 1) / 2,
	skipPot: boolean = false, // Only for making testing or core/debug faster
) => {
	const ratings = p.ratings.at(-1);
	let age = ratings.season - p.born.year;

	for (let i = 0; i < years; i++) {
		// (CONFUSING!) Don't increment age for existing players developing one season (i.e. newPhasePreseason) because the season is already incremented before this function is called. But in other scenarios (new league and draft picks), the season is not changing, so age should be incremented every iteration of this loop.
		if (newPlayer || years > 1) {
			age += 1;
		}

		if (!ratings.locked) {
			await developSeason(ratings, age, p.srID, coachingRank);
		}
	}

	// years===0 condition is so editing locked player in God Mode will update ovr and pot
	if (!ratings.locked || years === 0) {
		// Run these even for players developing 0 seasons
		if (isSport("basketball")) {
			ratings.ovr = ovr(ratings);

			if (!skipPot) {
				ratings.pot = await bootstrapPot({ ratings, age, srID: p.srID });
			}

			if (p.hasOwnProperty("pos") && typeof p.pos === "string") {
				// Must be a custom league player, let's not rock the boat
				ratings.pos = p.pos;
			} else {
				ratings.pos = pos(ratings);
			}
		} else {
			let pos;
			let maxOvr = -Infinity; // A player can never have KR or PR as his main position

			const bannedPositions = ["KR", "PR"];
			ratings.ovrs = POSITIONS.reduce((ovrs, pos2) => {
				ovrs[pos2] = ovr(ratings, pos2);

				if (!bannedPositions.includes(pos2) && ovrs[pos2] > maxOvr) {
					pos = pos2;
					maxOvr = ovrs[pos2];
				}

				return ovrs;
			}, {});

			if (!skipPot) {
				ratings.pots = {};
				for (const pos2 of POSITIONS) {
					ratings.pots[pos2] = await bootstrapPot({
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

			if (p.hasOwnProperty("pos") && typeof p.pos === "string") {
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
			const newWeight = genWeight(ratings.hgt, ratings.stre, ratings.pos);
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
