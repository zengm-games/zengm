import { achievement, checkAccount } from "../util";
import type { Conditions, UpdateEvents, ViewInput } from "../../common/types";

const updateAccount = async (
	inputs: ViewInput<"account">,
	updateEvents: UpdateEvents,
	state: unknown,
	conditions: Conditions,
) => {
	if (updateEvents.includes("firstRun") || updateEvents.includes("account")) {
		const partialTopMenu = await checkAccount(conditions);
		const loggedIn =
			partialTopMenu.username !== undefined &&
			partialTopMenu.username !== null &&
			partialTopMenu.username !== "";
		const goldUntilDate = new Date(partialTopMenu.goldUntil * 1000);
		const goldUntilDateString = goldUntilDate.toDateString();
		const currentTimestamp = Math.floor(Date.now() / 1000);
		const showGoldActive =
			loggedIn &&
			!partialTopMenu.goldCancelled &&
			currentTimestamp <= partialTopMenu.goldUntil;
		const showGoldCancelled =
			loggedIn &&
			partialTopMenu.goldCancelled &&
			currentTimestamp <= partialTopMenu.goldUntil;
		const showGoldPitch = !loggedIn || !showGoldActive;
		return {
			email: partialTopMenu.email,
			goldMessage: inputs.goldMessage,
			goldSuccess: inputs.goldSuccess,
			goldUntilDateString,
			loggedIn,
			showGoldActive,
			showGoldCancelled,
			showGoldPitch,
			username: partialTopMenu.username,
		};
	}
};

const updateAchievements = async (
	inputs: unknown,
	updateEvents: UpdateEvents,
) => {
	if (updateEvents.includes("firstRun")) {
		const achievements = await achievement.getAll();
		return {
			achievements,
		};
	}
};

export default async (
	inputs: ViewInput<"account">,
	updateEvents: UpdateEvents,
	state: any,
	conditions: Conditions,
) => {
	return Object.assign(
		{},
		await updateAccount(inputs, updateEvents, state, conditions),
		await updateAchievements(inputs, updateEvents),
	);
};
