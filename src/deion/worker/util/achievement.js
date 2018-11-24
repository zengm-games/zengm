// @flow

/*eslint camelcase: 0*/
import { fetchWrapper } from "../../common";
import { idb } from "../db";
import env from "./env";
import logEvent from "./logEvent";
import overrides from "./overrides";
import type { Conditions } from "../../common/types";

/**
 * Records one or more achievements.
 *
 * If logged in, try to record remotely and fall back to IndexedDB if necessary. If not logged in, just write to IndexedDB. Then, create a notification.
 *
 * @memberOf util.helpers
 * @param {Array.<string>} achievements Array of achievement IDs (see allAchievements above).
 * @param {boolean=} silent If true, don't show any notifications (like if achievements are only being moved from IDB to remote). Default false.
 * @return {Promise}
 */
async function add(
    slugs: string[],
    conditions: Conditions,
    silent?: boolean = false,
) {
    const notify = slug => {
        // Find name of achievement
        if (overrides.achievements[slug]) {
            logEvent(
                {
                    type: "achievement",
                    text: `"${
                        overrides.achievements[slug].name
                    }" achievement awarded! <a href="/account">View all achievements.</a>`,
                    saveToDb: false,
                },
                conditions,
            );
        }
    };

    const addToIndexedDB = slugs2 => {
        return idb.meta.tx("achievements", "readwrite", tx => {
            for (const slug of slugs2) {
                tx.achievements.add({ slug });
                notify(slug);
            }
        });
    };

    if (!silent) {
        for (const slug of slugs) {
            notify(slug);
        }
    }

    try {
        const data = await fetchWrapper({
            url: `//account.basketball-gm.${env.tld}/add_achievements.php`,
            method: "POST",
            data: { achievements: slugs, sport: process.env.SPORT },
            credentials: "include",
        });

        if (!data.success) {
            await addToIndexedDB(slugs);
        }
    } catch (err) {
        await addToIndexedDB(slugs);
    }
}

async function getAll(): Promise<
    {
        count: number,
        desc: string,
        name: string,
        slug: string,
    }[],
> {
    const achievements = Object.keys(overrides.achievements).map(slug => {
        const { desc, name } = overrides.achievements[slug];
        return {
            count: 0,
            desc,
            name,
            slug,
        };
    });
    const achievementsLocal = await idb.meta.achievements.getAll();

    // Handle any achivements stored in IndexedDB
    for (let j = 0; j < achievementsLocal.length; j++) {
        for (let i = 0; i < achievements.length; i++) {
            if (achievements[i].slug === achievementsLocal[j].slug) {
                achievements[i].count += 1;
            }
        }
    }

    try {
        // Handle any achievements stored in the cloud
        const achievementsRemote = await fetchWrapper({
            url: `//account.basketball-gm.${env.tld}/get_achievements.php`,
            method: "GET",
            data: { sport: process.env.SPORT },
            credentials: "include",
        });

        // Merge local and remote achievements
        for (let i = 0; i < achievements.length; i++) {
            if (achievementsRemote[achievements[i].slug] !== undefined) {
                achievements[i].count +=
                    achievementsRemote[achievements[i].slug];
            }
        }

        return achievements;
    } catch (err) {
        // If remote fails, still return local achievements
        return achievements;
    }
}

const check = async (
    slug: string,
    conditions: Conditions,
    saveAchievement: boolean = true,
) => {
    const achievement = overrides.achievements[slug];

    if (!achievement) {
        throw new Error(`No achievement found for ${slug}`);
    }

    const result = await achievement.check();

    if (result && saveAchievement) {
        add([slug], conditions);
    }

    return result;
};

export default {
    add,
    check,
    getAll,
};
