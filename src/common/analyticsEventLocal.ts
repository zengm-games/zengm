import { ACCOUNT_API_URL } from "./constants";
import fetchWrapper from "./fetchWrapper";

export const analyticsEventLocal = async (
	type: "new_league" | "completed_season",
) => {
	try {
		await fetchWrapper({
			url: `${ACCOUNT_API_URL}/log_event.php`,
			method: "POST",
			data: {
				sport: process.env.SPORT,
				type,
			},
			credentials: "include",
		});
	} catch (error) {
		console.error(error);
	}
};