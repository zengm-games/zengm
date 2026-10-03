import { achievement } from "../util/index.ts";
import type { Conditions, UpdateEvents } from "../../common/types.ts";
import type { ViewInput } from "../util/defineView.ts";
import { checkAccount } from "../util/checkAccount.ts";

const updateAchievements = async (
	inputs: ViewInput<"account">,
	updateEvents: UpdateEvents,
	state: unknown,
	conditions: Conditions,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("account")) {
		await checkAccount(conditions);
		const achievements = await achievement.getAll();

		return {
			achievements,
		};
	}
};

export default updateAchievements;
