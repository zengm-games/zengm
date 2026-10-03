import { ACCOUNT_API_URL } from "../../common/constants.ts";
import { checkAccount } from "../util/checkAccount.ts";
import { fetchWrapper } from "../../common/fetchWrapper.ts";
import { defineView } from "../util/defineView.ts";

export default defineView(
	"accountUpdateCard",
	async ({ updateEvents, conditions }) => {
		if (updateEvents.includes("firstRun") || updateEvents.includes("account")) {
			const partialTopMenu = await checkAccount(conditions);

			try {
				const data = await fetchWrapper({
					url: `${ACCOUNT_API_URL}/gold_card_info.php`,
					method: "GET",
					data: {
						sport: __SPORT,
					},
					credentials: "include",
				});
				return {
					goldCancelled: partialTopMenu.goldCancelled,
					last4: data.last4,
					expMonth: data.expMonth,
					expYear: data.expYear,
					username: partialTopMenu.username,
				};
			} catch {
				return {
					goldCancelled: partialTopMenu.goldCancelled,
					last4: "????",
					expMonth: "??",
					expYear: "????",
					username: partialTopMenu.username,
				};
			}
		}
	},
);
