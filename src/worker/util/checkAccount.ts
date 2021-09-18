import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import { idb } from "../db";
import achievement from "./achievement";
import local from "./local";
import toUI from "./toUI";
import type { Conditions, PartialTopMenu } from "../../common/types";
import { groupBy } from "../../common/groupBy";

// If it tries to add achievements from IDB to API twice at the same time, weird stuff could happen
let adding = false;

const checkAccount = async (
	conditions: Conditions,
): Promise<PartialTopMenu> => {
	try {
		const data = await fetchWrapper({
			url: `${ACCOUNT_API_URL}/user_info.php`,
			method: "GET",
			data: {
				sport: process.env.SPORT,
			},
			credentials: "include",
		});

		// Keep track of latest here, for ads and multi tab sync
		local.goldUntil = data.gold_until;
		local.mailingList = !!data.mailing_list;
		local.username = data.username === "" ? undefined : data.username;
		const currentTimestamp = Math.floor(Date.now() / 1000);
		await toUI("updateLocal", [
			{
				gold: currentTimestamp <= data.gold_until,
				username: data.username,
			},
		]);

		// If user is logged in, upload any locally saved achievements
		if (data.username !== "" && !adding) {
			// Should be done inside one transaction to eliminate race conditions, but Firefox doesn't like that and the
			// risk is very small.

			adding = true;

			const achievements = (await idb.meta.getAll("achievements")).map(row => ({
				// Default difficulty, for upgraded cases
				difficulty: "normal",
				...row,
			}));
			if (achievements.length > 0) {
				await idb.meta.clear("achievements");
			}

			const rowsByDifficulty = groupBy(achievements, "difficulty");
			for (const [difficulty, rows] of Object.entries(rowsByDifficulty)) {
				const slugs = rows.map(({ slug }) => slug);

				// If any exist, upload
				if (slugs.length > 0) {
					// If this fails to save remotely, will be added to IDB again
					await achievement.add(slugs, conditions, difficulty as any, true);
				}
			}

			adding = false;
		}

		return {
			email: data.email,
			goldCancelled: !!data.gold_cancelled,
			goldUntil: data.gold_until,
			username: data.username,
			mailingList: !!data.mailing_list,
		};
	} catch (err) {
		// Don't freak out if an AJAX request fails or whatever
		console.log(err);
		return {
			email: "",
			goldCancelled: false,
			goldUntil: Infinity,
			username: "",
			mailingList: false,
		};
	}
};

export default checkAccount;
