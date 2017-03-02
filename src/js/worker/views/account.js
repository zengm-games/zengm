// @flow

import {account} from '../util';
import type {GetOutput, UpdateEvents} from '../../common/types';

async function updateAccount(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
    state: any,
    topMenu: any,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun') || updateEvents.includes('account')) {
        await account.check();

        const goldUntilDate = new Date(topMenu.goldUntil * 1000);
        const goldUntilDateString = goldUntilDate.toDateString();

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const showGoldActive = !topMenu.goldCancelled && currentTimestamp <= topMenu.goldUntil;
        const showGoldCancelled = topMenu.goldCancelled && currentTimestamp <= topMenu.goldUntil;
        const showGoldPitch = !showGoldActive;

        return {
            email: topMenu.email,
            goldMessage: inputs.goldMessage,
            goldSuccess: inputs.goldSuccess,
            goldUntilDateString,
            showGoldActive,
            showGoldCancelled,
            showGoldPitch,
            username: topMenu.username,
        };
    }
}

async function updateAchievements(
    inputs: GetOutput,
    updateEvents: UpdateEvents,
): void | {[key: string]: any} {
    if (updateEvents.includes('firstRun')) {
        const achievements = await account.getAchievements();

        return {
            achievements,
        };
    }
}

export default {
    runBefore: [updateAccount, updateAchievements],
};
