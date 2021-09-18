import { achievement, checkAccount } from "../util";
import type { Conditions, UpdateEvents, ViewInput } from "../../common/types";

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
