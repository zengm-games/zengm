const g = require('../globals');
const account = require('../util/account');
const bbgmViewReact = require('../util/bbgmViewReact');
const Account = require('./views/Account');

function get(req) {
    return {
        goldSuccess: req.raw.goldResult !== undefined && req.raw.goldResult.success !== undefined ? req.raw.goldResult.success : null,
        goldMessage: req.raw.goldResult !== undefined && req.raw.goldResult.message !== undefined ? req.raw.goldResult.message : null,
    };
}

async function updateAccount(inputs, updateEvents) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
        await account.check();

        const goldUntilDate = new Date(g.vm.topMenu.goldUntil() * 1000);
        const goldUntilDateString = goldUntilDate.toDateString();

        const currentTimestamp = Math.floor(Date.now() / 1000);
        const showGoldActive = !g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil();
        const showGoldCancelled = g.vm.topMenu.goldCancelled() && currentTimestamp <= g.vm.topMenu.goldUntil();
        const showGoldPitch = !showGoldActive;

        return {
            username: g.vm.topMenu.username(),
            goldUntilDateString,
            showGoldActive,
            showGoldCancelled,
            showGoldPitch,
            goldSuccess: inputs.goldSuccess,
            goldMessage: inputs.goldMessage,
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

module.exports = bbgmViewReact.init({
    id: "account",
    get,
    inLeague: false,
    runBefore: [updateAccount, updateAchievements],
    Component: Account,
});
