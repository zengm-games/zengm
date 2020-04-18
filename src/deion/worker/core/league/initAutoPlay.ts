import autoPlay from "./autoPlay";
import { local, toUI } from "../../util";
import type { Conditions } from "../../../common/types";

const initAutoPlay = async (conditions: Conditions) => {
	const result = await toUI(
		"confirm",
		[
			"This will play through multiple seasons, using the AI to manage your team. How many seasons do you want to simulate?",
			{
				defaultValue: "5",
				okText: "Simulate!",
			},
		],
		conditions,
	);
	const numSeasons = parseInt(result, 10);

	if (Number.isInteger(numSeasons)) {
		local.autoPlaySeasons = numSeasons;
		autoPlay(conditions);
	} else {
		return false;
	}
};

export default initAutoPlay;
