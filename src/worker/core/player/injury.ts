import { defaultInjuries, g, helpers, random } from "../../util";
import type { InjuriesSetting, PlayerInjury } from "../../../common/types";

let prevInjuries: InjuriesSetting | undefined;

let cumSums: number[] = [];

/**
 * Pick injury type and duration.
 *
 * This depends on core.data.injuries, health expenses, and randomness.
 *
 * @param {number} healthRank Between 1 and g.get("numActiveTeams") (default 30), 1 if the player's team has the highest health spending this season and g.get("numActiveTeams") if the player's team has the lowest.
 * @return {Object} Injury object (type and gamesRemaining)
 */
const injury = (healthRank: number): PlayerInjury => {
	const injuries = g.get("injuries") ?? defaultInjuries;

	if (injuries !== prevInjuries) {
		cumSums = [];

		for (let i = 0; i < injuries.length; i++) {
			cumSums[i] = injuries[i].frequency;
			if (i > 0) {
				cumSums[i] += cumSums[i - 1];
			}
		}

		prevInjuries = injuries;
	}

	const rand = random.uniform(0, cumSums.at(-1));
	const i = cumSums.findIndex(cs => cs >= rand);
	const gamesRemaining = Math.round(
		((0.7 * (healthRank - 1)) / (g.get("numActiveTeams") - 1) + 0.65) *
			random.uniform(0.25, 1.75) *
			injuries[i].games,
	);

	return {
		type: injuries[i].name,
		gamesRemaining: helpers.bound(gamesRemaining, 0, Infinity),
	};
};

export default injury;
