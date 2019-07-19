// @flow

import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import { idb } from "../db";
import achievement from "./achievement";
import local from "./local";
import toUI from "./toUI";
import type { Conditions, PartialTopMenu } from "../../common/types";

const checkAccount = async (
    conditions: Conditions,
): Promise<PartialTopMenu> => {
    try {
        const data = await fetchWrapper({
            url: `${ACCOUNT_API_URL}/user_info.php`,
            method: "GET",
            data: { sport: process.env.SPORT },
            credentials: "include",
        });

        // Keep track of latest here, for ads
        local.goldUntil = data.gold_until;

        const currentTimestamp = Math.floor(Date.now() / 1000);
        await toUI([
            "updateLocal",
            {
                gold: currentTimestamp <= data.gold_until,
                username: data.username,
            },
        ]);

        // If user is logged in, upload any locally saved achievements
        if (data.username !== "") {
            // Should be done inside one transaction to eliminate race conditions, but Firefox doesn't like that and the
            // risk is very small.
            const achievements = await idb.meta.achievements.getAll();
            const slugs = achievements.map(({ slug }) => slug);
            // If any exist, delete and upload
            if (slugs.length > 0) {
                await idb.meta.achievements.clear();
                // If this fails to save remotely, will be added to IDB again
                await achievement.add(slugs, conditions, true);
            }
        }

        return {
            email: data.email,
            goldCancelled: !!data.gold_cancelled,
            goldUntil: data.gold_until,
            username: data.username,
        };
    } catch (err) {
        // Don't freak out if an AJAX request fails or whatever
        console.log(err);

        return {
            email: "",
            goldCancelled: false,
            goldUntil: Infinity,
            username: "",
        };
    }
};

export default checkAccount;
