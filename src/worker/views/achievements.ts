import { achievement } from "../util/index.ts";
import { defineView } from "../util/defineView.ts";
import { checkAccount } from "../util/checkAccount.ts";

export default defineView(
	"achievements",
	async ({ updateEvents, conditions }) => {
		if (updateEvents.includes("firstRun") || updateEvents.includes("account")) {
			await checkAccount(conditions);
			const achievements = await achievement.getAll();

			return {
				achievements,
			};
		}
	},
);
