import { checkAccount } from "../util/checkAccount.ts";
import { defineView } from "../util/defineView.ts";
import type { RouteParams } from "../../ui/router/types.ts";
import { isGoldActive } from "../../common/isGoldActive.ts";

const processInputs = (params: RouteParams<"account">, ctxBBGM: any) => {
	return {
		goldMessage: ctxBBGM.goldResult ? ctxBBGM.goldResult.message : undefined,
		goldSuccess: ctxBBGM.goldResult ? !!ctxBBGM.goldResult.success : undefined,
	};
};

export default defineView({
	id: "account",
	processInputs,
	load: async ({ inputs, updateEvents, conditions }) => {
		if (updateEvents.has("firstRun") || updateEvents.has("account")) {
			const partialTopMenu = await checkAccount(conditions);
			const loggedIn =
				partialTopMenu.username !== undefined &&
				partialTopMenu.username !== null &&
				partialTopMenu.username !== "";
			const goldUntilDate = new Date(partialTopMenu.goldUntil * 1000);
			const goldUntilDateString = goldUntilDate.toDateString();
			const goldActive = loggedIn && isGoldActive(partialTopMenu.goldUntil);
			const showGoldActive = goldActive && !partialTopMenu.goldCancelled;
			const showGoldCancelled = goldActive && partialTopMenu.goldCancelled;
			const showGoldPitch = !showGoldActive;

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
	},
});
