import account from '../util/account';
import bbgmViewReact from '../util/bbgmViewReact';
import Account from './views/Account';

function get(req) {
    return {
        goldMessage: req.raw.goldResult !== undefined ? req.raw.goldResult.message : undefined,
        goldSuccess: req.raw.goldResult !== undefined ? req.raw.goldResult.success : undefined,
    };
}

async function updateAccount(inputs, updateEvents, state, setState, topMenu) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
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

async function updateAchievements(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0) {
        const achievements = await account.getAchievements();

        return {
            achievements,
        };
    }
}

export default bbgmViewReact.init({
    id: "account",
    get,
    inLeague: false,
    runBefore: [updateAccount, updateAchievements],
    Component: Account,
});
