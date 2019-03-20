// @flow

/*eslint camelcase: 0*/
import { ACCOUNT_API_URL, fetchWrapper } from "../../common";
import { idb } from "../db";
import logEvent from "./logEvent";
import overrides from "./overrides";
import type { AchievementWhen, Conditions } from "../../common/types";

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
        const achievement = overrides.util.achievements.find(
            achievement2 => slug === achievement2.slug,
        );
        if (!achievement) {
            throw new Error(`No achievement found for slug "${slug}"`);
        }

        logEvent(
            {
                type: "achievement",
                text: `"${
                    achievement.name
                }" achievement awarded! <a href="/account">View all achievements.</a>`,
                saveToDb: false,
            },
            conditions,
        );
    };

    const addToIndexedDB = slugs2 => {
        return idb.meta.tx("achievements", "readwrite", tx => {
            for (const slug of slugs2) {
                tx.achievements.add({ slug });
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
            url: `${ACCOUNT_API_URL}/add_achievements.php`,
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
    const achievements = overrides.util.achievements.map(
        ({ desc, name, slug }) => {
            return {
                count: 0,
                desc,
                name,
                slug,
            };
        },
    );
    const achievementsLocal = await idb.meta.achievements.getAll();

    // Handle any achivements stored in IndexedDB
    for (const achievementLocal of achievementsLocal) {
        for (const achievement of achievements) {
            if (achievement.slug === achievementLocal.slug) {
                achievement.count += 1;
            }
        }
    }

    try {
        // Handle any achievements stored in the cloud
        const achievementsRemote = await fetchWrapper({
            url: `${ACCOUNT_API_URL}/get_achievements.php`,
            method: "GET",
            data: { sport: process.env.SPORT },
            credentials: "include",
        });

        // Merge local and remote achievements
        for (const achievement of achievements) {
            if (achievementsRemote[achievement.slug] !== undefined) {
                achievement.count += achievementsRemote[achievement.slug];
            }
        }

        return achievements;
    } catch (err) {
        // If remote fails, still return local achievements
        return achievements;
    }
}

const check = async (when: AchievementWhen, conditions: Conditions) => {
    const awarded = [];

    for (const achievement of overrides.util.achievements) {
        if (achievement.when === when && achievement.check !== undefined) {
            const result = await achievement.check();
            if (result) {
                awarded.push(achievement.slug);
            }
        }
    }

    if (awarded.length > 0) {
        add(awarded, conditions);
    }
};

export default {
    add,
    check,
    getAll,
};
