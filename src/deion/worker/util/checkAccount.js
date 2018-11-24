// @flow

import { fetchWrapper } from "../../common";
import { idb } from "../db";
import env from "./env";
import local from "./local";
import toUI from "./toUI";
import { account } from "../../../basketball/worker/util";
import type { Conditions, PartialTopMenu } from "../../common/types";

const checkAccount = async (
    conditions: Conditions,
): Promise<PartialTopMenu> => {
    try {
        const data = await fetchWrapper({
            url: `//account.basketball-gm.${env.tld}/user_info.php`,
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
        if (data.username !== "" && idb.league !== undefined) {
            // Should be done inside one transaction to eliminate race conditions, but Firefox doesn't like that and the
            // risk is very small.
            let achievements = await idb.league.achievements.getAll();
            achievements = achievements.map(achievement => achievement.slug);
            // If any exist, delete and upload
            if (achievements.length > 0) {
                await idb.league.achievements.clear();
                // If this fails to save remotely, will be added to IDB again
                await account.addAchievements(achievements, conditions, true);
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
