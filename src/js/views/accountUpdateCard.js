const g = require('../globals');
const Promise = require('bluebird');
const $ = require('jquery');
const account = require('../util/account');
const bbgmViewReact = require('../util/bbgmViewReact');
const AccountUpdateCard = require('./views/AccountUpdateCard');

async function updateAccountUpdateCard(inputs, updateEvents, state, setState, topMenu) {
    if (updateEvents.indexOf("firstRun") >= 0 || updateEvents.indexOf("account") >= 0) {
        await account.check();

        try {
            const data = await Promise.resolve($.ajax({
                type: "GET",
                url: `//account.basketball-gm.${g.tld}/gold_card_info.php`,
                data: {
                    sport: "basketball",
                },
                dataType: "json",
                xhrFields: {
                    withCredentials: true,
                },
            }));
            return {
                goldCancelled: topMenu.goldCancelled,
                last4: data.last4,
                expMonth: data.expMonth,
                expYear: data.expYear,
                username: topMenu.username,
            };
        } catch (err) {
            return {
                goldCancelled: topMenu.goldCancelled,
                last4: "????",
                expMonth: "??",
                expYear: "????",
                username: topMenu.username,
            };
        }
    }
}

module.exports = bbgmViewReact.init({
    id: "accountUpdateCard",
    inLeague: false,
    runBefore: [updateAccountUpdateCard],
    Component: AccountUpdateCard,
});
