import { defaultInjuries, g, helpers, random } from "../../util";
import type { InjuriesSetting, PlayerInjury } from "../../../common/types";
import { healthEffect } from "../../../common/budgetLevels";

let prevInjuries: InjuriesSetting | undefined;

let cumSums: number[] = [];

const injury = (healthLevel: number): PlayerInjury => {
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

	const rand = random.uniform(0, cumSums.at(-1)!);
	const i = cumSums.findIndex(cs => cs >= rand);
	const gamesRemaining = Math.round(
		(1 + healthEffect(healthLevel)) *
			random.uniform(0.25, 1.75) *
			injuries[i].games,
	);

	return {
		type: injuries[i].name,
		gamesRemaining: helpers.bound(gamesRemaining, 0, Infinity),
	};
};

export default injury;
