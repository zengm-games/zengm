// Pre-optimization methods retained only for regression tests and benchmarks.
// Keep these independent of production refactors so seeded comparisons are useful.
import { helpers } from "../../util/index.ts";
import GameSim from "./index.ts";

const teamNums = [0, 1] as const;
const compositeRatingsToUpdate = [
	"dribbling",
	"passing",
	"rebounding",
	"defense",
	"defensePerimeter",
	"blocking",
] as const;

export default class ReferenceGameSim extends GameSim {
	compositeFatigue = new Array<number>(this.numPlayersOnCourt);
	compositeFoulFactor = new Array<number>(this.numPlayersOnCourt);
	override updateTeamCompositeRatings() {
		const foulLimit = this.getFoulTroubleLimit();

		// Scale composite ratings
		for (const t of teamNums) {
			const oppT = teamNums[1 - t]!;
			const diff = this.team[t].stat.pts - this.team[oppT].stat.pts;

			const perfFactor = 1 - 0.2 * Math.tanh(diff / 60);
			const playersOnCourt = this.playersOnCourt[t];

			// These values do not change between ratings, so compute them once per
			// player rather than six times per possession.
			for (let i = 0; i < this.numPlayersOnCourt; i++) {
				const p = playersOnCourt[i]!;
				this.compositeFatigue[i] = this.fatigue(p.stat.energy);

				const pf = p.stat.pf;
				if (pf === foulLimit) {
					this.compositeFoulFactor[i] = 0.9;
				} else if (pf > foulLimit) {
					this.compositeFoulFactor[i] = 0.75;
				} else {
					this.compositeFoulFactor[i] = 1;
				}
			}

			for (const rating of compositeRatingsToUpdate) {
				this.team[t].compositeRating[rating] = 0;
				const isDefenseRating =
					rating === "defense" ||
					rating === "defensePerimeter" ||
					rating === "blocking";

				for (let i = 0; i < this.numPlayersOnCourt; i++) {
					const p = playersOnCourt[i]!;
					const foulLimitFactor = isDefenseRating
						? this.compositeFoulFactor[i]!
						: 1;

					this.team[t].compositeRating[rating] +=
						p.compositeRating[rating] *
						this.compositeFatigue[i]! *
						perfFactor *
						foulLimitFactor;
				}

				this.team[t].compositeRating[rating] /= 5;
			}

			this.team[t].compositeRating.dribbling +=
				this.synergyFactor * this.team[t].synergy.off;
			this.team[t].compositeRating.passing +=
				this.synergyFactor * this.team[t].synergy.off;
			this.team[t].compositeRating.rebounding +=
				this.synergyFactor * this.team[t].synergy.reb;
			this.team[t].compositeRating.defense +=
				this.synergyFactor * this.team[t].synergy.def;
			this.team[t].compositeRating.defensePerimeter +=
				this.synergyFactor * this.team[t].synergy.def;
			this.team[t].compositeRating.blocking +=
				this.synergyFactor * this.team[t].synergy.def;
		}
	}

	override updateSynergy() {
		for (const t of teamNums) {
			// Count all the *fractional* skills of the active players on a team (including duplicates)
			const skillsCount = {
				"3": 0,
				A: 0,
				B: 0,
				Di: 0,
				Dp: 0,
				Po: 0,
				Ps: 0,
				R: 0,
			};

			for (let i = 0; i < this.numPlayersOnCourt; i++) {
				const p = this.playersOnCourt[t][i]!;

				// 1 / (1 + e^-(15 * (x - 0.61))) from 0 to 1
				// 0.61 is not always used - keep in sync with skills.js!

				skillsCount["3"] += helpers.sigmoid(
					p.compositeRating.shootingThreePointer,
					15,
					0.59,
				);
				skillsCount.A += helpers.sigmoid(
					p.compositeRating.athleticism,
					15,
					0.63,
				);
				skillsCount.B += helpers.sigmoid(p.compositeRating.dribbling, 15, 0.68);
				skillsCount.Di += helpers.sigmoid(
					p.compositeRating.defenseInterior,
					15,
					0.57,
				);
				skillsCount.Dp += helpers.sigmoid(
					p.compositeRating.defensePerimeter,
					15,
					0.61,
				);
				skillsCount.Po += helpers.sigmoid(
					p.compositeRating.shootingLowPost,
					15,
					0.61,
				);
				skillsCount.Ps += helpers.sigmoid(p.compositeRating.passing, 15, 0.63);
				skillsCount.R += helpers.sigmoid(
					p.compositeRating.rebounding,
					15,
					0.61,
				);
			}

			// Base offensive synergy
			this.team[t].synergy.off = 0;
			this.team[t].synergy.off += 5 * helpers.sigmoid(skillsCount["3"], 3, 2); // 5 / (1 + e^-(3 * (x - 2))) from 0 to 5

			this.team[t].synergy.off +=
				3 * helpers.sigmoid(skillsCount.B, 15, 0.75) +
				helpers.sigmoid(skillsCount.B, 5, 1.75); // 3 / (1 + e^-(15 * (x - 0.75))) + 1 / (1 + e^-(5 * (x - 1.75))) from 0 to 5

			this.team[t].synergy.off +=
				3 * helpers.sigmoid(skillsCount.Ps, 15, 0.75) +
				helpers.sigmoid(skillsCount.Ps, 5, 1.75) +
				helpers.sigmoid(skillsCount.Ps, 5, 2.75); // 3 / (1 + e^-(15 * (x - 0.75))) + 1 / (1 + e^-(5 * (x - 1.75))) + 1 / (1 + e^-(5 * (x - 2.75))) from 0 to 5

			this.team[t].synergy.off += helpers.sigmoid(skillsCount.Po, 15, 0.75); // 1 / (1 + e^-(15 * (x - 0.75))) from 0 to 5

			this.team[t].synergy.off +=
				helpers.sigmoid(skillsCount.A, 15, 1.75) +
				helpers.sigmoid(skillsCount.A, 5, 2.75); // 1 / (1 + e^-(15 * (x - 1.75))) + 1 / (1 + e^-(5 * (x - 2.75))) from 0 to 5

			this.team[t].synergy.off /= 17; // Punish teams for not having multiple perimeter skills

			const perimFactor =
				helpers.bound(
					Math.sqrt(1 + skillsCount.B + skillsCount.Ps + skillsCount["3"]) - 1,
					0,
					2,
				) / 2; // Between 0 and 1, representing the perimeter skills

			this.team[t].synergy.off *= 0.5 + 0.5 * perimFactor; // Defensive synergy

			this.team[t].synergy.def = 0;
			this.team[t].synergy.def += helpers.sigmoid(skillsCount.Dp, 15, 0.75); // 1 / (1 + e^-(15 * (x - 0.75))) from 0 to 5

			this.team[t].synergy.def += 2 * helpers.sigmoid(skillsCount.Di, 15, 0.75); // 2 / (1 + e^-(15 * (x - 0.75))) from 0 to 5

			this.team[t].synergy.def +=
				helpers.sigmoid(skillsCount.A, 5, 2) +
				helpers.sigmoid(skillsCount.A, 5, 3.25); // 1 / (1 + e^-(5 * (x - 2))) + 1 / (1 + e^-(5 * (x - 3.25))) from 0 to 5

			this.team[t].synergy.def /= 6; // Rebounding synergy

			this.team[t].synergy.reb = 0;
			this.team[t].synergy.reb +=
				helpers.sigmoid(skillsCount.R, 15, 0.75) +
				helpers.sigmoid(skillsCount.R, 5, 1.75); // 1 / (1 + e^-(15 * (x - 0.75))) + 1 / (1 + e^-(5 * (x - 1.75))) from 0 to 5

			this.team[t].synergy.reb /= 4;
		}
	}
}
